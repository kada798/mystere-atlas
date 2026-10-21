import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  assertReleaseTree,
  validateVersion,
} from '../scripts/release-utils.mjs';

test('release versions cannot inject shell syntax, paths or output lines', () => {
  assert.equal(validateVersion('0.1.0'), '0.1.0');
  assert.equal(validateVersion('1.2.3-beta.1'), '1.2.3-beta.1');
  for (const value of [
    '../1.0.0',
    'v1.0.0',
    '1.0.0\nother=value',
    '1.0.0;echo',
    '01.0.0',
    '1.0',
  ])
    assert.throws(() => validateVersion(value));
});

async function fixture(action: (directory: string) => Promise<void>) {
  const root = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(root, 'mystere-release-test-'));
  try {
    await action(directory);
  } finally {
    const relative = path.relative(root, path.resolve(directory));
    assert.ok(
      relative.startsWith('mystere-release-test-') &&
        !relative.includes(path.sep) &&
        !relative.includes('..'),
    );
    await rm(directory, { recursive: true, force: true });
  }
}

test('release inspection rejects traced environment secrets at any depth', async () => {
  await fixture(async (directory) => {
    await mkdir(path.join(directory, 'server'));
    await writeFile(
      path.join(directory, 'server', '.env.production'),
      'SECRET=test',
    );
    await assert.rejects(assertReleaseTree(directory), /forbidden file/);
  });
});

test('release inspection rejects local runtime data and permits ordinary application files', async () => {
  await fixture(async (directory) => {
    await writeFile(
      path.join(directory, 'server.js'),
      'console.log("fixture")',
    );
    await assertReleaseTree(directory);
    await mkdir(path.join(directory, '.data'));
    await assert.rejects(assertReleaseTree(directory), /forbidden file/);
  });
});

test(
  'release symlinks must remain relative and inside the artifact',
  { skip: process.platform === 'win32' },
  async () => {
    await fixture(async (directory) => {
      const runtime = path.join(directory, 'runtime');
      await mkdir(runtime);
      await writeFile(path.join(runtime, 'inside.js'), 'export {}');
      await symlink('inside.js', path.join(runtime, 'valid.js'));
      await assertReleaseTree(runtime);
      await writeFile(path.join(directory, 'private.txt'), 'private fixture');
      await symlink('../private.txt', path.join(runtime, 'escape.js'));
      await assert.rejects(assertReleaseTree(runtime), /escaping symlink/);
    });
  },
);
