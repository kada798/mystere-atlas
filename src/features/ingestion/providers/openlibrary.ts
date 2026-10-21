import { fetchJson } from '../http';
import { record, strings, text, mergeCatalog } from '../normalize';
import { emptyData } from '../store.server';
import type { CatalogSnapshot, Work } from '../../catalog/types';

const languageCodes: Record<string, string> = {
  eng: 'en',
  fre: 'fr',
  fra: 'fr',
  chi: 'zh',
  zho: 'zh',
  ger: 'de',
  deu: 'de',
  jpn: 'ja',
  kor: 'ko',
  spa: 'es',
};
export function normalizeOpenLibrary(
  raw: unknown,
  checkedAt: string,
): CatalogSnapshot {
  const output = emptyData().catalog;
  const doc = record(raw);
  const key = text(doc.key);
  const title = text(doc.title);
  if (!/^\/works\/OL\d+W$/.test(key) || !title) return output;
  const id = `ol-${key.split('/').pop()}`;
  const authorNames = strings(doc.author_name);
  const authorKeys = strings(doc.author_key);
  const credits: Work['credits'] = [];
  authorNames.forEach((name, index) => {
    const key = authorKeys[index];
    if (!key || !/^OL\d+A$/.test(key)) return;
    const personId = `ol-${key}`;
    credits.push({ personId, role: 'author' });
    output.people.push({
      id: personId,
      names: [{ language: 'und', title: name }],
      summaries: {},
      roles: ['author'],
      sources: [
        {
          provider: 'Open Library',
          externalId: key,
          url: `https://openlibrary.org/authors/${key}`,
          checkedAt,
        },
      ],
    });
  });
  const work: Work = {
    id,
    kind: 'book',
    names: [{ language: 'und', title }],
    summaries: {},
    addedAt: checkedAt,
    firstReleaseDate:
      typeof doc.first_publish_year === 'number'
        ? String(doc.first_publish_year)
        : undefined,
    credits,
    details: {},
    editorialStatus: 'imported',
    sources: [
      {
        provider: 'Open Library',
        externalId: key,
        url: `https://openlibrary.org${key}`,
        checkedAt,
      },
    ],
  };
  const editions = record(doc.editions);
  if (Array.isArray(editions.docs))
    for (const rawEdition of editions.docs) {
      const edition = record(rawEdition);
      const editionKey = text(edition.key);
      const codes = strings(edition.language)
        .map((code) => languageCodes[code])
        .filter(Boolean);
      if (!/^\/books\/OL\d+M$/.test(editionKey) || !codes.length) continue;
      const editionTitle = text(edition.title) || title;
      for (const code of codes)
        if (
          !work.names.some(
            (name) => name.language === code && name.title === editionTitle,
          )
        )
          work.names.push({ language: code, title: editionTitle });
      output.versions.push({
        id: `ol-${editionKey.split('/').pop()}`,
        workId: id,
        language: codes[0],
        subtitleLanguages: [],
        translatorIds: [],
        title: editionTitle,
        identifier: strings(edition.isbn_13)[0]
          ? { kind: 'isbn', value: strings(edition.isbn_13)[0] }
          : undefined,
      });
    }
  output.works.push(work);
  return output;
}
export async function importOpenLibrary(
  checkedAt: string,
): Promise<CatalogSnapshot> {
  let output = emptyData().catalog;
  for (const locale of ['en', 'fr', 'zh']) {
    const url = new URL('https://openlibrary.org/search.json');
    url.search = new URLSearchParams({
      q: 'subject:mystery',
      lang: locale,
      limit: '12',
      fields:
        'key,title,author_name,author_key,first_publish_year,editions,editions.key,editions.title,editions.language,editions.isbn_13',
    }).toString();
    const data = record(await fetchJson(url));
    if (!Array.isArray(data.docs))
      throw new Error('Invalid Open Library response');
    for (const doc of data.docs)
      output = mergeCatalog(output, normalizeOpenLibrary(doc, checkedAt));
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  return output;
}
