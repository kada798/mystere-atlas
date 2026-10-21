import { readStoredData } from '../src/features/ingestion/store.server';

async function main() {
  const data = await readStoredData();
  if (data.catalog.works.length === 0 || data.events.length === 0)
    throw new Error(
      'Refusing to deploy an empty catalog or Paris events snapshot.',
    );
  if (data.sources.some((source) => source.state === 'error'))
    throw new Error(
      'A public source failed to refresh. Resolve it before deploying.',
    );
  console.log(
    JSON.stringify({
      works: data.catalog.works.length,
      events: data.events.length,
      syncedAt: data.syncedAt,
    }),
  );
}
main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Invalid deployment snapshot',
  );
  process.exitCode = 1;
});
