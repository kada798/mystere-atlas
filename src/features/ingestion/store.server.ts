import { readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StoredData } from './types';

export function emptyData(): StoredData {
  return {
    version: 1,
    catalog: {
      works: [],
      people: [],
      culture: [],
      places: [],
      series: [],
      versions: [],
      availability: [],
      relations: [],
    },
    events: [],
    sources: [],
  };
}
export async function readStoredData(
  directory = path.join(process.cwd(), '.data'),
): Promise<StoredData> {
  try {
    const data: unknown = JSON.parse(
      await readFile(path.join(directory, 'snapshot.json'), 'utf8'),
    );
    if (!data || typeof data !== 'object')
      throw new Error('Invalid data snapshot');
    const record = data as StoredData;
    if (
      record.version !== 1 ||
      !record.catalog ||
      !Array.isArray(record.events) ||
      !Array.isArray(record.sources) ||
      ![
        'works',
        'people',
        'culture',
        'places',
        'series',
        'versions',
        'availability',
        'relations',
      ].every((key) =>
        Array.isArray(record.catalog[key as keyof typeof record.catalog]),
      )
    )
      throw new Error('Invalid data snapshot schema');
    return record;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyData();
    throw error;
  }
}
export async function writeStoredData(
  data: StoredData,
  directory = path.join(process.cwd(), '.data'),
) {
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, 'snapshot.json');
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(temporary, target);
}
