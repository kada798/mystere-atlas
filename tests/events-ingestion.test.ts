import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  isParis,
  parseEventQuery,
  selectEvents,
  validParisCoordinates,
} from '../src/features/events/query';
import {
  matchedKeywords,
  mergeCatalog,
  normalizeParisEvent,
} from '../src/features/ingestion/normalize';
import { normalizeOpenLibrary } from '../src/features/ingestion/providers/openlibrary';
import { normalizeImdbRow } from '../src/features/ingestion/providers/imdb';
import {
  emptyData,
  readStoredData,
  writeStoredData,
} from '../src/features/ingestion/store.server';
import zhEvents from '../messages/events/zh.json';
import enEvents from '../messages/events/en.json';
import frEvents from '../messages/events/fr.json';
import zhSources from '../messages/sources/zh.json';
import enSources from '../messages/sources/en.json';
import frSources from '../messages/sources/fr.json';

const at = '2026-10-20T12:00:00Z';
const raw = {
  id: 'test-event',
  title: 'Club de lecture polar',
  lead_text: 'Rencontre autour du roman policier',
  url: 'https://www.paris.fr/evenements/test',
  date_start: '2026-11-01T14:00:00Z',
  date_end: '2026-11-01T16:00:00Z',
  address_city: 'Paris',
  address_zipcode: '75011',
  address_name: 'Test venue',
  lat_lon: { lat: 48.86, lon: 2.38 },
  locale: 'fr',
  price_type: 'gratuit',
};
test('the Paris scope rejects suburbs and invalid coordinates', () => {
  assert.equal(isParis('Paris', '75011'), true);
  assert.equal(isParis('Puteaux', '92800'), false);
  assert.equal(isParis('Paris', '92100'), false);
  assert.equal(validParisCoordinates(0, 0), false);
  assert.equal(validParisCoordinates(48.86, 2.38), true);
  assert.equal(
    normalizeParisEvent(
      { ...raw, address_city: 'Puteaux', address_zipcode: '92800' },
      at,
    ),
    undefined,
  );
});
test('keyword matching excludes word fragments and non-mystery events', () => {
  assert.deepEqual(matchedKeywords('Polarisation des idées'), []);
  assert.equal(
    normalizeParisEvent(
      { ...raw, title: 'Concert de piano', lead_text: 'Musique classique' },
      at,
    ),
    undefined,
  );
});
test('imported descriptions are text, unsafe URLs rejected, and description language does not imply spoken language', () => {
  const event = normalizeParisEvent(
    { ...raw, lead_text: '<script>alert(1)</script><b>Roman policier</b>' },
    at,
  )!;
  assert.equal(event.description, 'Roman policier');
  assert.deepEqual(event.languages, []);
  assert.equal(event.descriptionLanguage, 'fr');
  assert.equal(
    normalizeParisEvent({ ...raw, url: 'javascript:alert(1)' }, at),
    undefined,
  );
});
test('upcoming, past and undated events are not mixed', () => {
  const event = normalizeParisEvent(raw, at)!;
  const past = {
    ...event,
    id: 'past',
    startsAt: '2026-01-01',
    endsAt: '2026-01-02',
  };
  const undated = {
    ...event,
    id: 'undated',
    startsAt: undefined,
    endsAt: undefined,
  };
  assert.deepEqual(
    selectEvents([event, past, undated], parseEventQuery({}), new Date(at)).map(
      (event) => event.id,
    ),
    [event.id],
  );
  assert.equal(
    selectEvents([past], parseEventQuery({ period: 'past' }), new Date(at))
      .length,
    1,
  );
  assert.equal(
    selectEvents([undated], parseEventQuery({ period: 'all' }), new Date(at))
      .length,
    1,
  );
});
test('Chinese discovery keywords can find French public event metadata', () => {
  const event = normalizeParisEvent(raw, at)!;
  assert.equal(
    selectEvents([event], parseEventQuery({ q: '推理' }), new Date(at)).length,
    1,
  );
  assert.equal(
    selectEvents([event], parseEventQuery({ language: 'fr' }), new Date(at))
      .length,
    0,
  );
  assert.equal(
    selectEvents(
      [event],
      parseEventQuery({ language: 'unknown' }),
      new Date(at),
    ).length,
    1,
  );
});
test('invalid map positions do not remove otherwise valid list records', () => {
  const event = normalizeParisEvent(
    { ...raw, lat_lon: { lat: 0, lon: 0 } },
    at,
  )!;
  assert.ok(event);
  assert.equal(event.coordinates, undefined);
});
test('Open Library editions use actual edition language rather than aggregate work-language lists', () => {
  const source = {
    key: '/works/OL123W',
    title: 'Test book',
    language: ['fre', 'eng'],
    author_key: ['OL123A'],
    author_name: ['Test author'],
  };
  const without = normalizeOpenLibrary(source, at);
  assert.equal(without.versions.length, 0);
  const withEdition = normalizeOpenLibrary(
    {
      ...source,
      editions: {
        docs: [{ key: '/books/OL1M', title: 'Titre test', language: ['fre'] }],
      },
    },
    at,
  );
  assert.equal(withEdition.versions[0].language, 'fr');
  assert.ok(
    withEdition.works[0].names.some(
      (name) => name.language === 'fr' && name.title === 'Titre test',
    ),
  );
});
test('IMDb importer selects Mystery titles, rejects adult and episode rows, and does not invent language', () => {
  const line =
    'tt12345\tmovie\tTest\tTest original\t0\t2020\t\\N\t90\tDrama,Mystery';
  const work = normalizeImdbRow(line, at)!;
  assert.equal(work.kind, 'film');
  assert.equal(work.originalLanguage, undefined);
  assert.equal(normalizeImdbRow(line.replace('\t0\t', '\t1\t'), at), undefined);
  assert.equal(
    normalizeImdbRow(line.replace('Drama,Mystery', 'Comedy'), at),
    undefined,
  );
  assert.equal(
    normalizeImdbRow(line.replace('movie', 'tvEpisode'), at),
    undefined,
  );
});
test('source merges are idempotent and preserve manual edits and first-added date', () => {
  const incoming = emptyData().catalog;
  incoming.works.push(
    normalizeImdbRow(
      'tt12345\tmovie\tTest\tTest\t0\t2020\t\\N\t90\tMystery',
      at,
    )!,
  );
  const merged = mergeCatalog(
    mergeCatalog(emptyData().catalog, incoming),
    incoming,
  );
  assert.equal(merged.works.length, 1);
  merged.works[0].editorialStatus = 'manual';
  merged.works[0].names = [{ language: 'zh', title: '人工校订' }];
  assert.equal(
    mergeCatalog(merged, incoming).works[0].names[0].title,
    '人工校订',
  );
});
test('atomic snapshots round-trip without fetching the network, and malformed snapshots are rejected', async () => {
  const root = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(root, 'mystere-atlas-test-'));
  try {
    assert.equal((await readStoredData(directory)).catalog.works.length, 0);
    const data = emptyData();
    data.events = [normalizeParisEvent(raw, at)!];
    await writeStoredData(data, directory);
    assert.equal(
      (await readStoredData(directory)).events[0].id,
      'paris-test-event',
    );
    assert.ok(
      (await readFile(path.join(directory, 'snapshot.json'), 'utf8')).includes(
        'Club de lecture',
      ),
    );
    await writeFile(
      path.join(directory, 'snapshot.json'),
      JSON.stringify({ version: 1, catalog: {}, events: [], sources: [] }),
    );
    await assert.rejects(readStoredData(directory), /schema/);
  } finally {
    const relative = path.relative(root, path.resolve(directory));
    assert.ok(
      relative.startsWith('mystere-atlas-test-') &&
        !relative.includes(path.sep) &&
        !relative.includes('..'),
    );
    await rm(directory, { recursive: true, force: true });
  }
});
test('event and source translations have the same keys in all three languages', () => {
  function keys(value: object, prefix = ''): string[] {
    return Object.entries(value)
      .flatMap(([key, item]) =>
        typeof item === 'object'
          ? keys(item, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      )
      .sort();
  }
  assert.deepEqual(keys(zhEvents), keys(enEvents));
  assert.deepEqual(keys(enEvents), keys(frEvents));
  assert.deepEqual(keys(zhSources), keys(enSources));
  assert.deepEqual(keys(enSources), keys(frSources));
});
