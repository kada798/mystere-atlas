import { fetchJson } from '../http';
import { normalizeParisEvent, record } from '../normalize';
import type { ParisEvent } from '../../events/types';

export async function importParisEvents(
  checkedAt: string,
): Promise<ParisEvent[]> {
  const terms = [
    'polar',
    'policier',
    'murder',
    'escape',
    'énigme',
    'mystère',
    'sherlock',
    'thriller',
    'agatha',
  ];
  const url = new URL(
    'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records',
  );
  url.search = new URLSearchParams({
    where: terms.map((term) => `search(*, "${term}")`).join(' OR '),
    limit: '100',
    order_by: 'date_end DESC',
    select:
      'id,url,title,lead_text,description,date_start,date_end,date_description,address_name,address_street,address_zipcode,address_city,lat_lon,price_type,access_link,updated_at,locale',
  }).toString();
  const events: ParisEvent[] = [];
  for (let offset = 0; offset < 300; offset += 100) {
    url.searchParams.set('offset', String(offset));
    const response = record(await fetchJson(url));
    if (!Array.isArray(response.results))
      throw new Error('Invalid Paris response');
    for (const raw of response.results) {
      const event = normalizeParisEvent(raw, checkedAt);
      if (event) events.push(event);
    }
    if (
      offset + 100 >= Number(response.total_count) ||
      response.results.length < 100
    )
      break;
  }
  return [...new Map(events.map((event) => [event.id, event])).values()];
}
