import { setTimeout as delay } from 'node:timers/promises';
import { importerHeaders } from './http';
import { record, text, plainText } from './normalize';
import { openLibraryDetail, wikipediaIntroduction } from './enrichment';
import { safeCoverUrl } from '../catalog/media';
import type { CatalogSnapshot, Work } from '../catalog/types';

async function metadata(url: URL | string) {
  const response = await fetch(url, {
    headers: importerHeaders,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Metadata HTTP ${response.status}`);
  return record(await response.json());
}
async function commonsCover(
  filename: string,
  checkedAt: string,
): Promise<Work['cover']> {
  if (!filename || filename.length > 250) return;
  const title = `File:${filename}`;
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '480',
    titles: title,
  }).toString();
  const data = await metadata(url);
  const page = record(Object.values(record(record(data.query).pages))[0]);
  const info = record(
    Array.isArray(page.imageinfo) ? page.imageinfo[0] : undefined,
  );
  const meta = record(info.extmetadata);
  const license = plainText(record(meta.LicenseShortName).value);
  const image = safeCoverUrl(text(info.thumburl) || text(info.url));
  if (!image || !/^(CC BY(?:-SA)? |CC0|Public domain)/i.test(license)) return;
  return {
    url: image,
    source: {
      provider: 'Wikimedia Commons',
      externalId: title,
      url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`,
      checkedAt,
    },
    credit: plainText(record(meta.Artist).value).slice(0, 180),
    license,
  };
}

async function enrichWork(work: Work, checkedAt: string): Promise<Work> {
  if (work.editorialStatus === 'manual') return work;
  const ol = work.sources.find(
    (source) =>
      source.provider === 'Open Library' &&
      /^\/works\/OL\d+W$/.test(source.externalId),
  );
  if (ol) {
    const raw = await metadata(`https://openlibrary.org${ol.externalId}.json`);
    const patch = openLibraryDetail(raw, work.id, checkedAt);
    return {
      ...work,
      ...patch,
      introductions: mergeIntroductions(
        work.introductions,
        patch.introductions,
      ),
    };
  }
  const wd = work.sources.find(
    (source) =>
      source.provider === 'Wikidata' && /^Q\d+$/.test(source.externalId),
  );
  if (!wd) return work;
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    ids: wd.externalId,
    props: 'sitelinks|claims',
  }).toString();
  const entity = record(record((await metadata(url)).entities)[wd.externalId]);
  const patch: Pick<Work, 'cover' | 'introductions'> = { introductions: [] };
  for (const language of ['zh', 'en', 'fr']) {
    const title = text(
      record(record(entity.sitelinks)[`${language}wiki`]).title,
    );
    if (!title) continue;
    const endpoint = new URL(`https://${language}.wikipedia.org/w/api.php`);
    endpoint.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'extracts',
      exintro: '1',
      explaintext: '1',
      redirects: '1',
      titles: title,
    }).toString();
    try {
      const data = await metadata(endpoint);
      const page = Object.values(record(record(data.query).pages))[0];
      const introduction = wikipediaIntroduction(page, language, checkedAt);
      if (introduction) patch.introductions!.push(introduction);
    } catch {
      /* An unavailable translation must not erase previous text. */
    }
    await delay(350);
  }
  const images = record(entity.claims).P18;
  const filename = text(
    record(
      record(record(Array.isArray(images) ? images[0] : undefined).mainsnak)
        .datavalue,
    ).value,
  );
  if (filename)
    try {
      patch.cover = await commonsCover(filename, checkedAt);
    } catch {
      /* Keep a previous verified cover. */
    }
  return {
    ...work,
    cover: patch.cover ?? work.cover,
    introductions: mergeIntroductions(work.introductions, patch.introductions),
  };
}
function mergeIntroductions(
  previous: Work['introductions'],
  incoming: Work['introductions'],
) {
  return [
    ...new Map(
      [...(previous ?? []), ...(incoming ?? [])].map((item) => [
        `${item.source.provider}:${item.language}`,
        item,
      ]),
    ).values(),
  ];
}
export async function enrichCatalog(
  catalog: CatalogSnapshot,
  onProgress?: (id: string, success: boolean) => void,
): Promise<CatalogSnapshot> {
  const works: Work[] = [];
  const checkedAt = new Date().toISOString();
  for (const work of catalog.works) {
    try {
      works.push(await enrichWork(work, checkedAt));
      onProgress?.(work.id, true);
    } catch {
      works.push(work);
      onProgress?.(work.id, false);
    }
    await delay(1100);
  }
  return { ...catalog, works };
}
