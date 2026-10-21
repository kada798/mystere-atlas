export const workTypes = [
  'book',
  'film',
  'series',
  'game',
  'murder-party',
  'escape-room',
] as const;
export type WorkType = (typeof workTypes)[number];
export const views = ['works', 'people', 'culture', 'places'] as const;
export type CatalogView = (typeof views)[number];
export const languages = ['zh', 'en', 'fr', 'ja', 'ko', 'de', 'es'] as const;
export const regions = [
  'FR',
  'CN',
  'GB',
  'US',
  'JP',
  'CA',
  'BE',
  'CH',
] as const;
export const contentLanguages = ['zh', 'en', 'fr'] as const;
export const sortOrders = ['added', 'title', 'release'] as const;

export const detailFields = {
  book: ['author', 'series', 'release', 'translator', 'pages'],
  film: ['director', 'writer', 'cast', 'release', 'duration'],
  series: ['director', 'writer', 'seasons', 'episodes', 'status'],
  game: ['creator', 'platforms', 'languages', 'duration', 'players'],
  'murder-party': [
    'creator',
    'players',
    'duration',
    'difficulty',
    'themes',
    'languages',
  ],
  'escape-room': ['city', 'venue', 'players', 'languages', 'fear', 'physical'],
} as const;
export type DetailField = (typeof detailFields)[WorkType][number];
