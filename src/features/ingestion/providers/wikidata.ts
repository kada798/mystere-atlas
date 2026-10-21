import { fetchJson } from '../http';
import { record, text } from '../normalize';
import { emptyData } from '../store.server';
import type {
  CatalogName,
  CatalogSnapshot,
  LocalizedText,
  Work,
} from '../../catalog/types';

type Entity = Record<string, unknown>;
function claims(entity: Entity, property: string): unknown[] {
  const list = record(entity.claims)[property];
  return Array.isArray(list)
    ? list
        .map((claim) => record(record(record(claim).mainsnak).datavalue).value)
        .filter((value) => value !== undefined)
    : [];
}
function entityIds(entity: Entity, property: string): string[] {
  return claims(entity, property)
    .map((value) => text(record(value).id))
    .filter((id) => /^Q\d+$/.test(id));
}
function labels(entity: Entity): CatalogName[] {
  const names: CatalogName[] = [];
  for (const code of ['zh', 'en', 'fr']) {
    const title = text(record(record(entity.labels)[code]).value);
    const aliases = record(entity.aliases)[code];
    if (title)
      names.push({
        language: code,
        title,
        aliases: Array.isArray(aliases)
          ? aliases
              .map((alias) => text(record(alias).value))
              .filter(Boolean)
              .slice(0, 6)
          : [],
      });
  }
  return names;
}
function descriptions(entity: Entity): LocalizedText {
  const result: LocalizedText = {};
  for (const code of ['zh', 'en', 'fr'] as const) {
    const value = text(record(record(entity.descriptions)[code]).value);
    if (value) result[code] = value;
  }
  return result;
}
async function entities(ids: string[]): Promise<Record<string, Entity>> {
  const output: Record<string, Entity> = {};
  for (let i = 0; i < ids.length; i += 40) {
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.search = new URLSearchParams({
      action: 'wbgetentities',
      ids: ids.slice(i, i + 40).join('|'),
      props: 'labels|descriptions|aliases|claims',
      languages: 'zh|en|fr',
      format: 'json',
    }).toString();
    const result = record(await fetchJson(url));
    for (const [id, value] of Object.entries(record(result.entities)))
      output[id] = record(value);
  }
  return output;
}
export async function importWikidata(
  checkedAt: string,
): Promise<CatalogSnapshot> {
  const query =
    'SELECT DISTINCT ?work WHERE { ?work wdt:P31 wd:Q11424; wdt:P136 wd:Q1200678. } LIMIT 30';
  const endpoint = new URL('https://query.wikidata.org/sparql');
  endpoint.search = new URLSearchParams({ query, format: 'json' }).toString();
  const response = record(await fetchJson(endpoint));
  const bindings = record(response.results).bindings;
  if (!Array.isArray(bindings))
    throw new Error('Invalid Wikidata query response');
  const ids = bindings
    .map(
      (binding) =>
        text(record(record(binding).work).value)
          .split('/')
          .pop() ?? '',
    )
    .filter((id) => /^Q\d+$/.test(id));
  const works = await entities(ids);
  const relatedIds = [
    ...new Set(
      Object.values(works).flatMap((entity) => [
        ...entityIds(entity, 'P57').slice(0, 2),
        ...entityIds(entity, 'P58').slice(0, 2),
        ...entityIds(entity, 'P364'),
      ]),
    ),
  ];
  const related = await entities(relatedIds);
  const output = emptyData().catalog;
  for (const [entityId, entity] of Object.entries(works)) {
    const names = labels(entity);
    if (!names.length) continue;
    const imdb = text(claims(entity, 'P345')[0]);
    const id = /^tt\d+$/.test(imdb) ? `imdb-${imdb}` : `wd-${entityId}`;
    const credits: Work['credits'] = [];
    for (const [property, role] of [
      ['P57', 'director'],
      ['P58', 'writer'],
    ] as const)
      for (const personId of entityIds(entity, property).slice(0, 2)) {
        const person = related[personId];
        if (!person || !labels(person).length) continue;
        credits.push({ personId: `wd-${personId}`, role });
        if (!output.people.some((record) => record.id === `wd-${personId}`))
          output.people.push({
            id: `wd-${personId}`,
            names: labels(person),
            summaries: descriptions(person),
            roles: [role],
            sources: [
              {
                provider: 'Wikidata',
                externalId: personId,
                url: `https://www.wikidata.org/wiki/${personId}`,
                checkedAt,
              },
            ],
          });
      }
    const externalLinks: NonNullable<Work['externalLinks']> = [];
    if (/^tt\d+$/.test(imdb))
      externalLinks.push({
        provider: 'IMDb',
        id: imdb,
        url: `https://www.imdb.com/title/${imdb}/`,
      });
    const douban = text(claims(entity, 'P4529')[0]);
    if (/^\d+$/.test(douban))
      externalLinks.push({
        provider: 'Douban',
        id: douban,
        url: `https://movie.douban.com/subject/${douban}/`,
      });
    const letterboxd = text(claims(entity, 'P6127')[0]);
    if (/^[a-zA-Z0-9-]{1,200}$/.test(letterboxd))
      externalLinks.push({
        provider: 'Letterboxd',
        id: letterboxd,
        url: `https://letterboxd.com/film/${letterboxd}/`,
      });
    const date = record(claims(entity, 'P577')[0]);
    const iso = text(date.time).replace(/^\+/, '');
    const precision = Number(date.precision);
    const firstReleaseDate = iso
      ? iso.slice(0, precision >= 11 ? 10 : precision === 10 ? 7 : 4)
      : undefined;
    const languageId = entityIds(entity, 'P364')[0];
    const language = languageId
      ? text(claims(related[languageId] ?? {}, 'P218')[0])
      : undefined;
    output.works.push({
      id,
      kind: 'film',
      names,
      summaries: descriptions(entity),
      sources: [
        {
          provider: 'Wikidata',
          externalId: entityId,
          url: `https://www.wikidata.org/wiki/${entityId}`,
          checkedAt,
        },
      ],
      externalLinks,
      originalLanguage: language || undefined,
      firstReleaseDate,
      addedAt: checkedAt,
      credits,
      details: {},
      editorialStatus: 'imported',
    });
  }
  return output;
}
