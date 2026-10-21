import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  catalogParameters,
  changeCatalogView,
  entityTitle,
  parseCatalogQuery,
  safeExternalUrl,
  selectRelatedEntities,
  selectWorks,
} from '../src/features/catalog/query';
import { emptyData } from '../src/features/ingestion/store.server';
import type { CatalogSnapshot, Work } from '../src/features/catalog/types';
import zh from '../messages/catalog/zh.json';
import en from '../messages/catalog/en.json';
import fr from '../messages/catalog/fr.json';

// Synthetic records are isolated to tests and never imported by application routes.
const work: Work = {
  id: 'test-work',
  names: [
    { language: 'zh', title: '测试书名', aliases: ['另一个测试名称'] },
    { language: 'fr', title: 'Énigme de test' },
  ],
  summaries: { zh: '仅用于测试', fr: 'Description de test' },
  sources: [],
  kind: 'book',
  addedAt: '2026-10-20',
  originalLanguage: 'en',
  credits: [{ personId: 'person-1', role: 'author' }],
  details: {},
};
const fixture: CatalogSnapshot = {
  works: [work],
  people: [
    {
      id: 'person-1',
      names: [{ language: 'fr', title: 'Créateur de test' }],
      summaries: { fr: 'Biographie de test' },
      sources: [],
      roles: ['author'],
    },
  ],
  places: [
    {
      id: 'place-1',
      names: [{ language: 'fr', title: 'Lieu de test' }],
      summaries: { fr: 'Un lieu' },
      sources: [],
      kind: 'venue',
      region: 'FR',
      city: 'Évry',
      languages: ['fr'],
    },
  ],
  culture: [],
  series: [],
  relations: [],
  versions: [
    {
      id: 'version-fr',
      workId: work.id,
      language: 'fr',
      subtitleLanguages: [],
      translatorIds: [],
    },
    {
      id: 'version-zh',
      workId: work.id,
      language: 'zh',
      subtitleLanguages: [],
      translatorIds: [],
    },
  ],
  availability: [
    {
      id: 'offer-fr',
      workId: work.id,
      versionId: 'version-fr',
      kind: 'buy',
      provider: 'test',
      region: 'FR',
      languages: ['fr'],
      url: 'https://example.com/fr',
      checkedAt: '2026-10-20',
    },
    {
      id: 'offer-cn',
      workId: work.id,
      versionId: 'version-zh',
      kind: 'buy',
      provider: 'test',
      region: 'CN',
      languages: ['zh'],
      url: 'https://example.com/cn',
      checkedAt: '2026-10-20',
    },
  ],
};

test('invalid and repeated query parameters are normalized without allowing arbitrary categories', () => {
  const query = parseCatalogQuery({
    type: 'invalid',
    view: ['works', 'places'],
    q: ['  hello  ', 'ignored'],
    region: 'invalid',
    sort: 'invalid',
  });
  assert.equal(query.type, 'all');
  assert.equal(query.view, 'works');
  assert.equal(query.q, 'hello');
  assert.equal(query.region, 'all');
  assert.equal(query.sort, 'added');
  assert.equal(parseCatalogQuery({ q: 'x'.repeat(500) }).q.length, 160);
});
test('one work can be found through Chinese aliases, French accents and creator names', () => {
  for (const q of ['另一个测试名称', 'enigme', 'createur'])
    assert.equal(
      selectWorks(fixture, parseCatalogQuery({ q }), 'zh')[0]?.id,
      work.id,
    );
});
test('multiple language versions do not create duplicate works', () => {
  assert.equal(selectWorks(fixture, parseCatalogQuery({}), 'fr').length, 1);
  assert.equal(
    selectWorks(fixture, parseCatalogQuery({ versionLanguage: 'zh' }), 'fr')
      .length,
    1,
  );
});
test('information language does not infer a translated description from a title or edition', () => {
  assert.equal(
    selectWorks(fixture, parseCatalogQuery({ contentLanguage: 'en' }), 'en')
      .length,
    0,
  );
  assert.equal(
    selectWorks(fixture, parseCatalogQuery({ contentLanguage: 'fr' }), 'en')
      .length,
    1,
  );
});
test('region and language must match the same access option', () => {
  assert.equal(
    selectWorks(
      fixture,
      parseCatalogQuery({ region: 'FR', versionLanguage: 'zh' }),
      'zh',
    ).length,
    0,
  );
  assert.equal(
    selectWorks(
      fixture,
      parseCatalogQuery({ region: 'FR', versionLanguage: 'fr' }),
      'zh',
    ).length,
    1,
  );
});
test('original language alone does not imply an available version', () => {
  assert.equal(
    selectWorks(fixture, parseCatalogQuery({ versionLanguage: 'en' }), 'en')
      .length,
    0,
  );
});
test('place search supports cities without accents and preserves region and service-language constraints', () => {
  assert.equal(
    selectRelatedEntities(
      fixture,
      parseCatalogQuery({
        view: 'places',
        q: 'evry',
        region: 'FR',
        versionLanguage: 'fr',
      }),
    ).length,
    1,
  );
  assert.equal(
    selectRelatedEntities(
      fixture,
      parseCatalogQuery({ view: 'places', q: 'evry', region: 'CN' }),
    ).length,
    0,
  );
});
test('switching entity views clears filters that have a different meaning there', () => {
  const query = changeCatalogView(
    parseCatalogQuery({
      type: 'film',
      q: 'test',
      contentLanguage: 'fr',
      region: 'FR',
      versionLanguage: 'zh',
    }),
    'people',
  );
  assert.equal(query.type, 'all');
  assert.equal(query.region, 'all');
  assert.equal(query.versionLanguage, 'all');
  assert.equal(query.q, 'test');
  assert.equal(query.contentLanguage, 'fr');
});
test('shareable filter parameters round-trip and keep the same search in another interface language', () => {
  const query = parseCatalogQuery({
    type: 'film',
    q: '中文 énigme',
    region: 'FR',
    contentLanguage: 'fr',
    versionLanguage: 'en',
    sort: 'title',
  });
  assert.deepEqual(parseCatalogQuery(catalogParameters(query)), query);
  assert.equal(entityTitle(work, 'fr'), 'Énigme de test');
  assert.equal(entityTitle(work, 'en'), '测试书名');
});
test('external source links accept web URLs and reject executable or credential-bearing URLs', () => {
  assert.equal(safeExternalUrl('javascript:alert(1)'), undefined);
  assert.equal(safeExternalUrl('https://user:password@example.com'), undefined);
  assert.equal(
    safeExternalUrl('https://example.com/source'),
    'https://example.com/source',
  );
});
test('an uninitialized snapshot contains no fabricated records', () => {
  const snapshot = emptyData().catalog;
  assert.ok(Object.values(snapshot).every((records) => records.length === 0));
});
test('all catalog labels exist in Chinese, English and French', () => {
  function keys(object: object, prefix = ''): string[] {
    return Object.entries(object)
      .flatMap(([key, value]) =>
        typeof value === 'object'
          ? keys(value, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      )
      .sort();
  }
  assert.deepEqual(keys(zh), keys(en));
  assert.deepEqual(keys(en), keys(fr));
});
