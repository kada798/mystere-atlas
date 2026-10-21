import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

const startServer = process.argv.includes('--start-server');
const standaloneDirectory = process.argv
  .find((value) => value.startsWith('--standalone='))
  ?.slice('--standalone='.length);
if (standaloneDirectory && !startServer)
  throw new Error('Standalone smoke checks require --start-server.');
const base =
  process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${startServer ? 3100 : 3000}`;
const serverUrl = new URL(base);
if (startServer && !['127.0.0.1', 'localhost'].includes(serverUrl.hostname)) {
  throw new Error('The temporary smoke server must use a loopback address.');
}

let server;
let serverOutput = '';

async function get(path, options = {}) {
  return fetch(new URL(path, base), {
    signal: AbortSignal.timeout(15000),
    ...options,
  });
}

try {
  if (startServer) {
    // Refuse to accidentally test an unrelated process already using this port.
    let occupied = false;
    try {
      await fetch(base, { signal: AbortSignal.timeout(800) });
      occupied = true;
    } catch {}
    assert.equal(occupied, false, `Port ${serverUrl.port} is already in use.`);

    server = spawn(
      process.execPath,
      standaloneDirectory
        ? [path.resolve(standaloneDirectory, 'server.js')]
        : [
            'node_modules/next/dist/bin/next',
            'start',
            '--hostname',
            '127.0.0.1',
            '--port',
            serverUrl.port || '3100',
          ],
      {
        cwd: standaloneDirectory
          ? path.resolve(standaloneDirectory)
          : process.cwd(),
        env: standaloneDirectory
          ? {
              ...process.env,
              PORT: serverUrl.port || '3100',
              HOSTNAME: '127.0.0.1',
            }
          : process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );
    server.stdout.on('data', (chunk) => {
      serverOutput += chunk;
    });
    server.stderr.on('data', (chunk) => {
      serverOutput += chunk;
    });

    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      assert.equal(
        server.exitCode,
        null,
        `Server exited early:\n${serverOutput}`,
      );
      try {
        const response = await fetch(new URL('/api/health', base), {
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(250);
    }
    assert.ok(ready, `Server did not become ready:\n${serverOutput}`);
  }

  const health = await get('/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {
    status: 'ok',
    application: 'mystere-atlas',
  });

  const root = await get('/', {
    redirect: 'manual',
    headers: { 'Accept-Language': 'zh' },
  });
  assert.ok([307, 308].includes(root.status));
  assert.equal(new URL(root.headers.get('location'), base).pathname, '/zh');

  const expected = {
    zh: '一本好推理',
    en: 'Find a mystery',
    fr: 'Une bonne énigme',
  };
  for (const [locale, phrase] of Object.entries(expected)) {
    const home = await get(`/${locale}`);
    assert.equal(home.status, 200, `${locale} home`);
    const html = await home.text();
    assert.ok(
      html.includes(`<html lang="${locale}"`),
      `${locale} document language`,
    );
    assert.ok(html.includes(phrase), `${locale} translated content`);
    for (const section of ['works', 'events', 'community', 'culture']) {
      assert.equal(
        (await get(`/${locale}/${section}`)).status,
        200,
        `${locale}/${section}`,
      );
    }
    for (const type of [
      'book',
      'film',
      'series',
      'game',
      'murder-party',
      'escape-room',
    ]) {
      const filtered = await get(
        `/${locale}/works?type=${type}&q=search-test&region=FR&versionLanguage=fr`,
      );
      assert.equal(filtered.status, 200, `${locale} category ${type}`);
      const filteredHtml = await filtered.text();
      assert.ok(
        filteredHtml.includes('value="search-test"'),
        'Search text survives a direct or refreshed URL',
      );
      assert.ok(
        filteredHtml.includes(`name="type" value="${type}"`),
        'Category is carried by the search form',
      );
    }
    for (const view of ['people', 'culture', 'places']) {
      assert.equal((await get(`/${locale}/works?view=${view}`)).status, 200);
    }
    for (const query of [
      '?type=reading',
      '?q=polar&period=all',
      '?period=past',
      '?language=unknown',
    ]) {
      assert.equal(
        (await get(`/${locale}/events${query}`)).status,
        200,
        `${locale} events ${query}`,
      );
    }
    assert.equal(
      (await get(`/${locale}/works/not-a-published-work`)).status,
      404,
    );
    assert.equal((await get(`/${locale}/unknown-section`)).status, 404);
  }
  assert.equal((await get('/de/works')).status, 404);
  console.log(
    'Smoke checks passed: health, locale redirect, three languages, module routes and unknown-route 404s.',
  );
} catch (error) {
  console.error(error);
  if (serverOutput) console.error(serverOutput);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    const closed = once(server, 'exit');
    server.kill();
    await closed;
  }
}
