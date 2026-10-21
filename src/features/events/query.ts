import { normalizeSearch } from '../catalog/query';
import type { SearchParameters } from '../catalog/types';
import type { EventKind, EventQuery, ParisEvent } from './types';

export const eventKinds: EventKind[] = [
  'reading',
  'screening',
  'game',
  'walk',
  'culture',
];
export const parisBounds = {
  south: 48.79,
  north: 48.93,
  west: 2.21,
  east: 2.48,
};
export function isParis(city: string, postalCode: string) {
  const normalized = normalizeSearch(city);
  return (
    (normalized === 'paris' || /^paris\s+\d/.test(normalized) || !normalized) &&
    /^75\d{3}$/.test(postalCode)
  );
}
export function validParisCoordinates(
  lat: unknown,
  lon: unknown,
): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= parisBounds.south &&
    lat <= parisBounds.north &&
    lon >= parisBounds.west &&
    lon <= parisBounds.east
  );
}
export function parseEventQuery(params: SearchParameters): EventQuery {
  const first = (key: string) =>
    Array.isArray(params[key]) ? params[key]?.[0] : params[key];
  return {
    q: (first('q') ?? '').trim().slice(0, 160),
    type: eventKinds.includes(first('type') as EventKind)
      ? (first('type') as EventKind)
      : 'all',
    period: ['past', 'all'].includes(first('period') ?? '')
      ? (first('period') as 'past' | 'all')
      : 'upcoming',
    language: ['zh', 'en', 'fr', 'unknown'].includes(first('language') ?? '')
      ? first('language')!
      : 'all',
  };
}
export function selectEvents(
  events: ParisEvent[],
  query: EventQuery,
  now = new Date(),
): ParisEvent[] {
  const translations: Record<string, string[]> = {
    推理: [
      'polar',
      'policier',
      'detective',
      'enquete',
      'agatha',
      'sherlock',
      'enigme',
      'thriller',
    ],
    悬疑: ['mystere', 'mystery', 'thriller', 'enquete', 'polar'],
    mystery: [
      'mystere',
      'mystery',
      'thriller',
      'enquete',
      'polar',
      'agatha',
      'sherlock',
    ],
    读书会: ['lecture', 'livre', 'auteur', 'bibliotheque'],
    密室: ['escape game', 'escape room'],
  };
  const searchTerms = translations[normalizeSearch(query.q)] ?? [
    normalizeSearch(query.q),
  ];
  return events
    .filter((event) => {
      if (!isParis(event.city, event.postalCode)) return false;
      const end = Date.parse(event.endsAt ?? event.startsAt ?? '');
      if (
        query.period === 'upcoming' &&
        (!Number.isFinite(end) || end < now.getTime())
      )
        return false;
      if (
        query.period === 'past' &&
        (!Number.isFinite(end) || end >= now.getTime())
      )
        return false;
      const searchable = normalizeSearch(
        [event.title, event.description, event.venue, ...event.keywords].join(
          ' ',
        ),
      );
      return (
        (query.type === 'all' || event.kind === query.type) &&
        (!query.q || searchTerms.some((term) => searchable.includes(term))) &&
        (query.language === 'all' ||
          (query.language === 'unknown'
            ? event.languages.length === 0
            : event.languages.includes(query.language)))
      );
    })
    .sort((a, b) => {
      const date = (event: ParisEvent) =>
        Date.parse(event.startsAt ?? event.endsAt ?? '') || 0;
      return query.period === 'past'
        ? date(b) - date(a)
        : Math.max(date(a), now.getTime()) - Math.max(date(b), now.getTime());
    });
}
