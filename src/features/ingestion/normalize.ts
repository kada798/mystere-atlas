import { safeExternalUrl, normalizeSearch } from '../catalog/query';
import type { CatalogSnapshot, Work } from '../catalog/types';
import type { EventKind, ParisEvent } from '../events/types';
import { isParis, validParisCoordinates } from '../events/query';

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
export function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
export function plainText(value: unknown): string {
  return text(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
export const mysteryTerms = [
  'polar',
  'policier',
  'detective',
  'thriller',
  'murder',
  'escape game',
  'escape room',
  'enigme',
  'mystere',
  'cluedo',
  'sherlock',
  'agatha',
  'roman noir',
  'enquete criminelle',
  "jeu d'enquete",
  '推理',
  '悬疑',
];
export function matchedKeywords(value: string): string[] {
  const normalized = normalizeSearch(value);
  return mysteryTerms.filter((term) =>
    term === '推理' || term === '悬疑'
      ? normalized.includes(term)
      : new RegExp(
          `(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es)?([^a-z]|$)`,
          'i',
        ).test(normalized),
  );
}
function classify(value: string): EventKind {
  const n = normalizeSearch(value);
  if (/escape|murder|cluedo|jeu d.enquete|enigme/.test(n)) return 'game';
  if (/balade|visite|parcours/.test(n)) return 'walk';
  if (/projection|cinema|film/.test(n)) return 'screening';
  if (/lecture|auteur|livre|bibliotheque|librairie|rencontre/.test(n))
    return 'reading';
  return 'culture';
}
export function normalizeParisEvent(
  raw: unknown,
  checkedAt: string,
): ParisEvent | undefined {
  const r = record(raw);
  const city = text(r.address_city);
  const postal = text(r.address_zipcode);
  const url = safeExternalUrl(text(r.url));
  const title = plainText(r.title);
  const description = plainText(r.lead_text || r.description);
  const keywords = matchedKeywords(`${title} ${description}`);
  if (
    !url ||
    !title ||
    !text(r.id) ||
    !isParis(city, postal) ||
    !keywords.length
  )
    return undefined;
  const geo = record(r.lat_lon);
  const coordinates = validParisCoordinates(geo.lat, geo.lon)
    ? { lat: geo.lat, lon: geo.lon as number }
    : undefined;
  const date = (value: unknown) =>
    text(value) && Number.isFinite(Date.parse(text(value)))
      ? text(value)
      : undefined;
  return {
    id: `paris-${r.id}`,
    title,
    description: description.slice(0, 500),
    descriptionLanguage: text(r.locale) || 'fr',
    kind: classify(`${title} ${description}`),
    startsAt: date(r.date_start),
    endsAt: date(r.date_end),
    schedule: plainText(r.date_description) || undefined,
    venue: plainText(r.address_name),
    address: plainText(r.address_street),
    postalCode: postal,
    city: 'Paris',
    coordinates,
    languages: [],
    price:
      r.price_type === 'gratuit'
        ? 'free'
        : r.price_type === 'payant'
          ? 'paid'
          : 'unknown',
    url,
    bookingUrl: safeExternalUrl(text(r.access_link)),
    keywords,
    sources: [{ provider: 'Paris Open Data', id: text(r.id), url, checkedAt }],
  };
}
export function mergeCatalog(
  base: CatalogSnapshot,
  incoming: CatalogSnapshot,
): CatalogSnapshot {
  const mergeById = <T extends { id: string }>(left: T[], right: T[]) => [
    ...new Map([...left, ...right].map((item) => [item.id, item])).values(),
  ];
  const works = new Map(base.works.map((work) => [work.id, work]));
  for (const next of incoming.works) {
    const old = works.get(next.id);
    if (!old) {
      works.set(next.id, next);
      continue;
    }
    if (old.editorialStatus === 'manual') continue;
    const names = [...old.names];
    for (const name of next.names)
      if (
        !names.some(
          (n) => n.language === name.language && n.title === name.title,
        )
      )
        names.push(name);
    const combined: Work = {
      ...old,
      ...next,
      addedAt: old.addedAt,
      names,
      summaries: { ...old.summaries, ...next.summaries },
      credits: [
        ...new Map(
          [...old.credits, ...next.credits].map((credit) => [
            `${credit.role}:${credit.personId}`,
            credit,
          ]),
        ).values(),
      ],
      details: { ...old.details, ...next.details },
      sources: [
        ...new Map(
          [...old.sources, ...next.sources].map((source) => [
            `${source.provider}:${source.externalId}`,
            source,
          ]),
        ).values(),
      ],
      externalLinks: [
        ...new Map(
          [...(old.externalLinks ?? []), ...(next.externalLinks ?? [])].map(
            (link) => [link.provider, link],
          ),
        ).values(),
      ],
    };
    works.set(next.id, combined);
  }
  return {
    works: [...works.values()],
    people: mergeById(base.people, incoming.people),
    culture: mergeById(base.culture, incoming.culture),
    places: mergeById(base.places, incoming.places),
    series: mergeById(base.series, incoming.series),
    versions: mergeById(base.versions, incoming.versions),
    availability: mergeById(base.availability, incoming.availability),
    relations: [
      ...new Map(
        [...base.relations, ...incoming.relations].map((relation) => [
          `${relation.fromId}:${relation.toId}:${relation.kind}`,
          relation,
        ]),
      ).values(),
    ],
  };
}
