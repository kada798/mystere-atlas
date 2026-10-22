import path from 'node:path';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { enrichCatalog } from '../src/features/ingestion/enrich.server';
import type { StoredData } from '../src/features/ingestion/types';

async function main() {
  const file = path.resolve(
    process.argv.find((arg) => arg.startsWith('--snapshot='))?.slice(11) ??
      '.data/snapshot.json',
  );
  const data = JSON.parse(await readFile(file, 'utf8')) as StoredData;
  if (data.version !== 1 || !Array.isArray(data.catalog?.works))
    throw new Error('Invalid snapshot');
  let failures = 0;
  data.catalog = await enrichCatalog(data.catalog, (id, success) => {
    if (!success) failures++;
    console.log(
      `${id}: ${success ? 'checked' : 'unavailable; previous data kept'}`,
    );
  });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
  await rename(temporary, file);
  console.log(
    JSON.stringify({
      works: data.catalog.works.length,
      covers: data.catalog.works.filter((w) => w.cover).length,
      introductions: data.catalog.works.filter((w) => w.introductions?.length)
        .length,
      failures,
    }),
  );
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Enrichment failed');
  process.exitCode = 1;
});
