import type { Work } from './types';

export function safeCoverUrl(value: string | undefined): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      ['covers.openlibrary.org', 'upload.wikimedia.org'].includes(url.hostname)
    )
      return url.href;
  } catch {
    /* Invalid external image metadata is ignored. */
  }
}

export function workIntroduction(work: Work, locale: string) {
  const entries = work.introductions?.filter((item) => item.text.trim()) ?? [];
  return (
    entries.find((item) => item.language === locale) ??
    entries.find((item) => item.language === 'en') ??
    entries[0]
  );
}
