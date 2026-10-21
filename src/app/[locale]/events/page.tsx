import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link, getPathname } from '@/i18n/navigation';
import { readStoredData } from '@/features/ingestion/store.server';
import { SourcePanel } from '@/features/ingestion/source-panel';
import {
  eventKinds,
  parseEventQuery,
  selectEvents,
} from '@/features/events/query';
import { EventsResults } from '@/features/events/components/events-results';
import type { SearchParameters } from '@/features/catalog/types';

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParameters>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations('Events');
  const query = parseEventQuery(await searchParams);
  const data = await readStoredData();
  const events = selectEvents(data.events, query);
  return (
    <div className="events-page">
      <header className="events-hero">
        <div>
          <p className="eyebrow">MYSTÈRE ATLAS / PARIS</p>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        <span className="events-region">{t('parisOnly')}</span>
      </header>
      <SourcePanel scope="events" />
      <form
        className="events-filters"
        method="get"
        action={getPathname({ locale, href: '/events' })}
        key={JSON.stringify(query)}
      >
        <label className="events-search">
          {t('searchLabel')}
          <input
            type="search"
            name="q"
            maxLength={160}
            defaultValue={query.q}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <label>
          {t('typeLabel')}
          <select name="type" defaultValue={query.type}>
            <option value="all">{t('allTypes')}</option>
            {eventKinds.map((kind) => (
              <option key={kind} value={kind}>
                {t(`kinds.${kind}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('periodLabel')}
          <select name="period" defaultValue={query.period}>
            <option value="upcoming">{t('periods.upcoming')}</option>
            <option value="past">{t('periods.past')}</option>
            <option value="all">{t('periods.all')}</option>
          </select>
        </label>
        <label>
          {t('languageLabel')}
          <select name="language" defaultValue={query.language}>
            <option value="all">{t('allLanguages')}</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="unknown">{t('languageUnknown')}</option>
          </select>
        </label>
        <button type="submit" className="button button-primary">
          {t('apply')}
        </button>
        <Link className="catalog-text-link" href="/events">
          {t('reset')}
        </Link>
      </form>
      <div className="events-summary">
        <h2>{t('results', { count: events.length })}</h2>
        <span>{t('timezone')}</span>
      </div>
      <EventsResults events={events} locale={locale} />
      <section className="events-discover">
        <div>
          <h2>{t('externalTitle')}</h2>
          <p>{t('externalDescription')}</p>
        </div>
        <div className="events-external-links">
          {['polar', 'mystery', 'escape game'].map((keyword) => (
            <a
              key={keyword}
              href={`https://www.meetup.com/find/?location=fr--paris&keywords=${encodeURIComponent(keyword)}&source=EVENTS`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Meetup · {keyword} ↗
            </a>
          ))}
        </div>
      </section>
      <p className="events-attribution">
        {t('attribution')}{' '}
        <a
          href="https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ville de Paris
        </a>{' '}
        ·{' '}
        <a
          href="https://opendatacommons.org/licenses/odbl/"
          target="_blank"
          rel="noopener noreferrer"
        >
          ODbL
        </a>
      </p>
    </div>
  );
}
