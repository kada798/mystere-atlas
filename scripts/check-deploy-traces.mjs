import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const snapshot = path.resolve('.data/snapshot.json');
for (const route of ['works/page', 'works/[id]/page', 'events/page']) {
  const filename = path.resolve(
    '.next/server/app/[locale]',
    `${route}.js.nft.json`,
  );
  const trace = JSON.parse(await readFile(filename, 'utf8'));
  const tracedFiles = trace.files.map((file) =>
    path.resolve(path.dirname(filename), file),
  );
  assert.ok(
    tracedFiles.includes(snapshot),
    `The ${route} server function is missing its public snapshot.`,
  );
}
console.log(
  'Public snapshot is traced into catalog, work details and Paris events.',
);
