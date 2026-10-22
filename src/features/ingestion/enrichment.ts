import { plainText, record, text } from './normalize';
import type { Work, SourceReference } from '../catalog/types';

export function introductionExcerpt(value: unknown, limit = 420) {
  const clean = plainText(value)
    .replace(/\s+([,.!?;:，。！？；：])/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*+/g, '')
    .trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit).replace(/\s+\S*$/, '');
  return cut + '…';
}

export function openLibraryDetail(
  raw: unknown,
  workId: string,
  checkedAt: string,
): Pick<Work, 'cover' | 'introductions'> {
  const doc = record(raw);
  const key = text(doc.key);
  if (!/^\/works\/OL\d+W$/.test(key) || workId !== `ol-${key.split('/').pop()}`)
    return {};
  const source: SourceReference = {
    provider: 'Open Library',
    externalId: key,
    url: `https://openlibrary.org${key}`,
    checkedAt,
  };
  const cover = Array.isArray(doc.covers)
    ? doc.covers.find((id) => Number.isSafeInteger(id) && Number(id) > 0)
    : undefined;
  const description = introductionExcerpt(
    typeof doc.description === 'string'
      ? doc.description
      : record(doc.description).value,
  );
  return {
    ...(cover
      ? {
          cover: {
            url: `https://covers.openlibrary.org/b/id/${cover}-L.jpg?default=false`,
            source,
          },
        }
      : {}),
    ...(description
      ? {
          introductions: [
            { language: 'und', text: description, source, excerpt: true },
          ],
        }
      : {}),
  };
}

export function wikipediaIntroduction(
  raw: unknown,
  language: string,
  checkedAt: string,
): NonNullable<Work['introductions']>[number] | undefined {
  const page = record(raw);
  const title = text(page.title);
  const body = introductionExcerpt(page.extract, 800);
  if (!body || !title || !Number.isSafeInteger(page.pageid)) return;
  const url = `https://${language}.wikipedia.org/?curid=${page.pageid}`;
  return {
    language,
    text: body,
    source: {
      provider: 'Wikipedia',
      externalId: String(page.pageid),
      url,
      checkedAt,
    },
    license: 'CC BY-SA 4.0',
    excerpt: true,
  };
}
