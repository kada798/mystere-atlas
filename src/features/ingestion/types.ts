import type { CatalogSnapshot } from '../catalog/types';
import type { ParisEvent } from '../events/types';

export type SourceId =
  | 'paris'
  | 'openlibrary'
  | 'wikidata'
  | 'imdb'
  | 'meetup'
  | 'douban'
  | 'letterboxd';
export type SourceStatus = {
  id: SourceId;
  state: 'ready' | 'error' | 'authorization' | 'unavailable' | 'pending';
  checkedAt?: string;
  lastSuccessAt?: string;
  count: number;
  detail?: string;
};
export type StoredData = {
  version: 1;
  syncedAt?: string;
  catalog: CatalogSnapshot;
  events: ParisEvent[];
  sources: SourceStatus[];
};
