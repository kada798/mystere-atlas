import { importerHeaders } from '../http';
import { emptyData } from '../store.server';
import type { CatalogSnapshot, Work } from '../../catalog/types';

export function normalizeImdbRow(
  line: string,
  checkedAt: string,
): Work | undefined {
  const [id, type, title, original, adult, year, , duration, genres] =
    line.split('\t');
  if (
    !/^tt\d+$/.test(id ?? '') ||
    !['movie', 'tvSeries', 'tvMiniSeries'].includes(type) ||
    adult !== '0' ||
    !genres?.split(',').includes('Mystery') ||
    Number(year) < 1970 ||
    !Number.isFinite(Number(year))
  )
    return;
  return {
    id: `imdb-${id}`,
    kind: type === 'movie' ? 'film' : 'series',
    names: [
      {
        language: 'und',
        title,
        aliases:
          original && original !== '\\N' && original !== title
            ? [original]
            : [],
      },
    ],
    summaries: {},
    firstReleaseDate: year,
    addedAt: checkedAt,
    credits: [],
    details: Number.isFinite(Number(duration))
      ? { duration: `${duration} min` }
      : {},
    editorialStatus: 'imported',
    sources: [
      {
        provider: 'IMDb dataset',
        externalId: id,
        url: 'https://data.imdb.com/non-commercial-datasets/',
        checkedAt,
      },
    ],
    externalLinks: [
      { provider: 'IMDb', id, url: `https://www.imdb.com/title/${id}/` },
    ],
  };
}
export async function importImdb(checkedAt: string): Promise<CatalogSnapshot> {
  const response = await fetch(
    'https://datasets.imdbws.com/title.basics.tsv.gz',
    { headers: importerHeaders, signal: AbortSignal.timeout(90000) },
  );
  if (!response.ok || !response.body)
    throw new Error(`IMDb HTTP ${response.status}`);
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let bytes = 0;
  const output = emptyData().catalog;
  try {
    while (output.works.length < 36 && bytes < 35000000) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      buffer += decoder.decode(value, { stream: true });
      let split: number;
      while ((split = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, split).replace(/\r$/, '');
        buffer = buffer.slice(split + 1);
        const work = normalizeImdbRow(line, checkedAt);
        if (work) output.works.push(work);
        if (output.works.length >= 36) break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  if (!output.works.length)
    throw new Error('No IMDb Mystery records found within the bounded import');
  return output;
}
