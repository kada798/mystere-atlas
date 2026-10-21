import type { CatalogSnapshot } from './types';
import { readStoredData } from '../ingestion/store.server';

export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  return (await readStoredData()).catalog;
}
