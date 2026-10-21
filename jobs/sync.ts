import { setTimeout as delay } from 'node:timers/promises';
import {
  readStoredData,
  writeStoredData,
} from '../src/features/ingestion/store.server';
import { mergeCatalog } from '../src/features/ingestion/normalize';
import { importParisEvents } from '../src/features/ingestion/providers/paris';
import { importOpenLibrary } from '../src/features/ingestion/providers/openlibrary';
import { importWikidata } from '../src/features/ingestion/providers/wikidata';
import { importImdb } from '../src/features/ingestion/providers/imdb';
import type { SourceId, SourceStatus } from '../src/features/ingestion/types';

async function synchronize() {
  const selectedSource = process.argv
    .find((arg) => arg.startsWith('--source='))
    ?.split('=')[1];
  if (
    selectedSource &&
    !['paris', 'openlibrary', 'wikidata', 'imdb'].includes(selectedSource)
  )
    throw new Error('Unknown import source');
  const data = await readStoredData();
  const checkedAt = new Date().toISOString();
  let failed = 0;
  async function run(id: SourceId, action: () => Promise<number>) {
    const previous = data.sources.find((source) => source.id === id);
    try {
      const count = await action();
      const status: SourceStatus = {
        id,
        state: 'ready',
        count,
        checkedAt,
        lastSuccessAt: checkedAt,
      };
      data.sources = data.sources.filter((source) => source.id !== id);
      data.sources.push(status);
      console.log(`${id}: ${count} records`);
    } catch (error) {
      failed++;
      data.sources = data.sources.filter((source) => source.id !== id);
      data.sources.push({
        id,
        state: 'error',
        count: previous?.count ?? 0,
        checkedAt,
        lastSuccessAt: previous?.lastSuccessAt,
        detail: error instanceof Error ? error.message : 'Import failed',
      });
      console.error(`${id}: import failed; keeping previous data`);
    }
    data.syncedAt = checkedAt;
    await writeStoredData(data);
  }
  if (!selectedSource || selectedSource === 'paris')
    await run('paris', async () => {
      const events = await importParisEvents(checkedAt);
      data.events = events;
      return events.length;
    });
  for (const [id, importer] of [
    ['openlibrary', importOpenLibrary],
    ['wikidata', importWikidata],
    ['imdb', importImdb],
  ] as const) {
    if (selectedSource && selectedSource !== id) continue;
    await run(id, async () => {
      const next = await importer(checkedAt);
      data.catalog = mergeCatalog(data.catalog, next);
      return next.works.length;
    });
  }
  console.log(
    JSON.stringify({
      works: data.catalog.works.length,
      events: data.events.length,
      failed,
      syncedAt: data.syncedAt,
    }),
  );
  return failed;
}

async function main() {
  if (process.argv.includes('--watch')) {
    console.log('Data worker active; refresh interval: 6 hours');
    if (!process.argv.includes('--skip-initial')) await synchronize();
    while (true) {
      await delay(6 * 60 * 60 * 1000);
      try {
        await synchronize();
      } catch {
        console.error('Data refresh failed; previous snapshot is preserved.');
      }
    }
  } else {
    const failed = await synchronize();
    if (failed > 0) process.exitCode = 1;
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Data worker failed');
  process.exitCode = 1;
});
