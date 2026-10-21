import {
  contentLanguages,
  languages,
  regions,
  sortOrders,
  views,
  workTypes,
} from './config';
import type {
  CatalogQuery,
  CatalogSnapshot,
  NamedEntity,
  SearchParameters,
  Work,
} from './types';

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function choice<T extends string>(
  value: string | undefined,
  options: readonly T[],
  fallback: T,
): T {
  return options.includes(value as T) ? (value as T) : fallback;
}
export function parseCatalogQuery(params: SearchParameters): CatalogQuery {
  const view = choice(first(params.view), views, 'works');
  return {
    view,
    type:
      view === 'works'
        ? choice(first(params.type), ['all', ...workTypes], 'all')
        : 'all',
    q: (first(params.q) ?? '').trim().slice(0, 160),
    contentLanguage: choice(
      first(params.contentLanguage),
      ['all', ...contentLanguages],
      'all',
    ),
    versionLanguage: ['works', 'places'].includes(view)
      ? choice(first(params.versionLanguage), ['all', ...languages], 'all')
      : 'all',
    region: ['works', 'places'].includes(view)
      ? choice(first(params.region), ['all', ...regions], 'all')
      : 'all',
    sort: choice(first(params.sort), sortOrders, 'added'),
  };
}
export function catalogParameters(query: CatalogQuery): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([key, value]) =>
        value !== 'all' &&
        value !== '' &&
        !(key === 'view' && value === 'works') &&
        !(key === 'sort' && value === 'added'),
    ),
  );
}
export function changeCatalogView(
  query: CatalogQuery,
  view: CatalogQuery['view'],
): CatalogQuery {
  return {
    ...query,
    view,
    type: 'all',
    region: 'all',
    versionLanguage: 'all',
    sort: 'added',
  };
}
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .trim();
}
export function entityTitle(entity: NamedEntity, locale: string): string {
  return (
    entity.names.find((name) => name.language === locale)?.title ??
    entity.names[0]?.title ??
    entity.id
  );
}
function hasContentLanguage(entity: NamedEntity, language: string) {
  return (
    language === 'all' ||
    Boolean(entity.summaries[language as keyof typeof entity.summaries]?.trim())
  );
}
function matchesText(entity: NamedEntity, query: string, extra: string[] = []) {
  const searchable = [
    ...entity.names.flatMap((name) => [name.title, ...(name.aliases ?? [])]),
    ...Object.values(entity.summaries),
    ...extra,
  ].join(' ');
  return !query || normalizeSearch(searchable).includes(normalizeSearch(query));
}
function matchesAccess(
  work: Work,
  query: CatalogQuery,
  data: CatalogSnapshot,
): boolean {
  const versions = data.versions.filter(
    (version) => version.workId === work.id,
  );
  const versionMatches = (version: (typeof versions)[number]) =>
    version.language === query.versionLanguage ||
    version.subtitleLanguages.includes(query.versionLanguage);
  const offers = data.availability.filter((offer) => offer.workId === work.id);
  if (query.region !== 'all') {
    // Language and region must be available in the SAME offer, not two unrelated records.
    return offers.some(
      (offer) =>
        offer.region === query.region &&
        (query.versionLanguage === 'all' ||
          offer.languages.includes(query.versionLanguage) ||
          versions.some(
            (version) =>
              version.id === offer.versionId && versionMatches(version),
          )),
    );
  }
  return (
    query.versionLanguage === 'all' ||
    versions.some(versionMatches) ||
    offers.some((offer) => offer.languages.includes(query.versionLanguage))
  );
}
export function selectWorks(
  data: CatalogSnapshot,
  query: CatalogQuery,
  locale: string,
): Work[] {
  return data.works
    .filter((work) => {
      const creators = work.credits.flatMap(
        (credit) =>
          data.people
            .find((person) => person.id === credit.personId)
            ?.names.flatMap((name) => [name.title, ...(name.aliases ?? [])]) ??
          [],
      );
      return (
        (query.type === 'all' || work.kind === query.type) &&
        hasContentLanguage(work, query.contentLanguage) &&
        matchesText(work, query.q, creators) &&
        matchesAccess(work, query, data)
      );
    })
    .sort((left, right) => {
      if (query.sort === 'title')
        return entityTitle(left, locale).localeCompare(
          entityTitle(right, locale),
          locale,
        );
      return (
        query.sort === 'release'
          ? (right.firstReleaseDate ?? '')
          : right.addedAt
      ).localeCompare(
        query.sort === 'release' ? (left.firstReleaseDate ?? '') : left.addedAt,
      );
    });
}
export function selectRelatedEntities(
  data: CatalogSnapshot,
  query: CatalogQuery,
): NamedEntity[] {
  if (query.view === 'places') {
    return data.places.filter(
      (place) =>
        hasContentLanguage(place, query.contentLanguage) &&
        matchesText(place, query.q, [place.city]) &&
        (query.region === 'all' || place.region === query.region) &&
        (query.versionLanguage === 'all' ||
          place.languages.includes(query.versionLanguage)),
    );
  }
  const records = query.view === 'people' ? data.people : data.culture;
  return records.filter(
    (entity) =>
      hasContentLanguage(entity, query.contentLanguage) &&
      matchesText(entity, query.q),
  );
}
export function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
