import type { SourceId } from './types';

export const sourceDefinitions: {
  id: SourceId;
  name: string;
  url: string;
  scope: 'events' | 'catalog';
  initial: 'pending' | 'authorization' | 'unavailable';
}[] = [
  {
    id: 'paris',
    name: 'Ville de Paris · Que Faire à Paris',
    url: 'https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/',
    scope: 'events',
    initial: 'pending',
  },
  {
    id: 'meetup',
    name: 'Meetup',
    url: 'https://help.meetup.com/hc/en-us/articles/41453576628749-How-can-I-get-access-to-Meetup-s-API',
    scope: 'events',
    initial: 'authorization',
  },
  {
    id: 'openlibrary',
    name: 'Open Library',
    url: 'https://openlibrary.org/dev/docs/api/search',
    scope: 'catalog',
    initial: 'pending',
  },
  {
    id: 'wikidata',
    name: 'Wikidata · CC0',
    url: 'https://www.wikidata.org/wiki/Wikidata:Data_access',
    scope: 'catalog',
    initial: 'pending',
  },
  {
    id: 'imdb',
    name: 'IMDb · Non-commercial datasets',
    url: 'https://data.imdb.com/non-commercial-datasets/',
    scope: 'catalog',
    initial: 'pending',
  },
  {
    id: 'douban',
    name: '豆瓣 / Douban',
    url: 'https://www.douban.com/robots.txt',
    scope: 'catalog',
    initial: 'unavailable',
  },
  {
    id: 'letterboxd',
    name: 'Letterboxd',
    url: 'https://letterboxd.com/api-beta/',
    scope: 'catalog',
    initial: 'authorization',
  },
];
