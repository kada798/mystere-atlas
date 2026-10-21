import type { Locale } from '@/i18n/routing';
import type { CatalogView, DetailField, WorkType } from './config';

export type LocalizedText = Partial<Record<Locale, string>>;
export type CatalogName = {
  language: string;
  title: string;
  aliases?: string[];
  official?: boolean;
};
export type SourceReference = {
  provider: string;
  externalId: string;
  url: string;
  checkedAt: string;
};
export type NamedEntity = {
  id: string;
  names: CatalogName[];
  summaries: LocalizedText;
  sources: SourceReference[];
};
export type Person = NamedEntity & { roles: string[] };
export type CultureEntry = NamedEntity & {
  workIds: string[];
  personIds: string[];
};
export type Place = NamedEntity & {
  kind: 'library' | 'bookshop' | 'venue';
  region: string;
  city: string;
  languages: string[];
};
export type WorkSeries = NamedEntity & { workIds: string[] };
export type Work = NamedEntity & {
  kind: WorkType;
  originalLanguage?: string;
  firstReleaseDate?: string;
  addedAt: string;
  credits: {
    personId: string;
    role: 'author' | 'director' | 'writer' | 'translator' | 'cast' | 'creator';
  }[];
  seriesId?: string;
  seriesOrder?: number;
  details: Partial<Record<DetailField, string | number | string[]>>;
  externalLinks?: { provider: string; id: string; url: string }[];
  editorialStatus?: 'imported' | 'manual';
};
export type WorkVersion = {
  id: string;
  workId: string;
  language: string;
  subtitleLanguages: string[];
  title?: string;
  translatorIds: string[];
  releaseDate?: string;
  identifier?: { kind: 'isbn' | 'external'; value: string };
};
export type Availability = {
  id: string;
  workId: string;
  versionId?: string;
  placeId?: string;
  kind: 'stream' | 'rent' | 'buy' | 'borrow' | 'experience';
  provider: string;
  region: string;
  languages: string[];
  url: string;
  checkedAt: string;
};
export type WorkRelation = {
  fromId: string;
  toId: string;
  kind: 'adaptation' | 'remake' | 'sequel';
};
export type CatalogSnapshot = {
  works: Work[];
  people: Person[];
  culture: CultureEntry[];
  places: Place[];
  series: WorkSeries[];
  versions: WorkVersion[];
  availability: Availability[];
  relations: WorkRelation[];
};
export type CatalogQuery = {
  view: CatalogView;
  type: WorkType | 'all';
  q: string;
  contentLanguage: string;
  versionLanguage: string;
  region: string;
  sort: 'added' | 'title' | 'release';
};
export type SearchParameters = Record<string, string | string[] | undefined>;
