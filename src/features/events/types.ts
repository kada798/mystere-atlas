export type EventKind = 'reading' | 'screening' | 'game' | 'walk' | 'culture';
export type ParisEvent = {
  id: string;
  title: string;
  description: string;
  descriptionLanguage: string;
  kind: EventKind;
  startsAt?: string;
  endsAt?: string;
  schedule?: string;
  venue: string;
  address: string;
  postalCode: string;
  city: 'Paris';
  coordinates?: { lat: number; lon: number };
  languages: string[];
  price: 'free' | 'paid' | 'unknown';
  url: string;
  bookingUrl?: string;
  keywords: string[];
  sources: { provider: string; id: string; url: string; checkedAt: string }[];
};
export type EventQuery = {
  q: string;
  type: EventKind | 'all';
  period: 'upcoming' | 'past' | 'all';
  language: string;
};
