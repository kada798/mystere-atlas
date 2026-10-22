import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  openLibraryDetail,
  wikipediaIntroduction,
} from '../src/features/ingestion/enrichment';
import { safeCoverUrl, workIntroduction } from '../src/features/catalog/media';
import type { Work } from '../src/features/catalog/types';

test('book enrichment requires the exact work ID and uses positive cover IDs', () => {
  const raw = {
    key: '/works/OL123W',
    covers: [-1, 42],
    description: { value: 'A <b>mystery</b>.<script>bad()</script>' },
  };
  assert.deepEqual(openLibraryDetail(raw, 'ol-OL456W', '2026-10-22'), {});
  const result = openLibraryDetail(raw, 'ol-OL123W', '2026-10-22');
  assert.equal(
    result.cover?.url,
    'https://covers.openlibrary.org/b/id/42-L.jpg?default=false',
  );
  assert.equal(result.introductions?.[0].text, 'A mystery.');
  assert.equal(result.introductions?.[0].language, 'und');
  assert.equal(
    result.introductions?.[0].source.url,
    'https://openlibrary.org/works/OL123W',
  );
});
test('Wikipedia excerpts retain exact language, source attribution and license', () => {
  const intro = wikipediaIntroduction(
    {
      pageid: 123,
      title: 'Test film',
      extract: 'An English film introduction.',
    },
    'en',
    '2026-10-22',
  );
  assert.equal(intro?.source.url, 'https://en.wikipedia.org/?curid=123');
  assert.equal(intro?.language, 'en');
  assert.equal(intro?.license, 'CC BY-SA 4.0');
  assert.equal(
    wikipediaIntroduction({ missing: true }, 'en', '2026-10-22'),
    undefined,
  );
});
test('fallback introductions keep their original language and prefer the requested locale', () => {
  const source = {
    provider: 'test',
    externalId: '1',
    url: 'https://example.com',
    checkedAt: '2026-10-22',
  };
  const work = {
    introductions: [
      { language: 'en', text: 'English', source },
      { language: 'fr', text: 'Français', source },
    ],
  } as Work;
  assert.equal(workIntroduction(work, 'fr')?.text, 'Français');
  assert.equal(workIntroduction(work, 'zh')?.language, 'en');
});
test('cover URLs reject executable URLs, credentials and unapproved image hosts', () => {
  for (const url of [
    'javascript:alert(1)',
    'http://covers.openlibrary.org/a.jpg',
    'https://covers.openlibrary.org.evil.test/a.jpg',
    'https://secret@covers.openlibrary.org/a.jpg',
  ])
    assert.equal(safeCoverUrl(url), undefined);
  assert.ok(
    safeCoverUrl(
      'https://upload.wikimedia.org/wikipedia/commons/a/a1/example.jpg',
    ),
  );
});
