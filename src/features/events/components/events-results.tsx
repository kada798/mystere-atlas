'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ParisEvent } from '../types';
import { EventsMap } from './events-map';

export function EventsResults({
  events,
  locale,
}: {
  events: ParisEvent[];
  locale: string;
}) {
  const t = useTranslations('Events');
  const [selectedId, setSelectedId] = useState<string>();
  const select = useCallback((id: string) => setSelectedId(id), []);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeZone: 'Europe/Paris',
    }).format(new Date(value));
  const mapped = events.filter((event) => event.coordinates).length;
  return (
    <div className="events-results">
      <section className="events-map-section" aria-label={t('mapLabel')}>
        <EventsMap events={events} selectedId={selectedId} onSelect={select} />
        <p className="events-map-caption">
          {t('mapped', { mapped, total: events.length })}
        </p>
      </section>
      <section className="events-list" aria-label={t('listLabel')}>
        {events.length === 0 ? (
          <div className="events-empty">
            <span className="eyebrow">PARIS</span>
            <h3>{t('emptyTitle')}</h3>
            <p>{t('emptyDescription')}</p>
          </div>
        ) : (
          events.map((event, index) => (
            <article
              className={`event-card ${selectedId === event.id ? 'is-selected' : ''}`}
              id={`event-${event.id}`}
              key={event.id}
            >
              <div className="event-card-top">
                <span className="event-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{t(`kinds.${event.kind}`)}</span>
                <span>{t(`prices.${event.price}`)}</span>
              </div>
              <h3>
                <a href={event.url} target="_blank" rel="noopener noreferrer">
                  {event.title} ↗
                </a>
              </h3>
              <p className="event-date">
                {event.startsAt ? date(event.startsAt) : t('dateUnknown')}
                {event.endsAt &&
                (!event.startsAt || date(event.endsAt) !== date(event.startsAt))
                  ? ` — ${date(event.endsAt)}`
                  : ''}
              </p>
              <p className="event-location">
                {event.venue} · {event.postalCode} Paris
              </p>
              <p className="event-description" lang={event.descriptionLanguage}>
                {event.description}
              </p>
              {event.schedule && (
                <details className="event-schedule">
                  <summary>{t('scheduleLabel')}</summary>
                  <p lang={event.descriptionLanguage}>{event.schedule}</p>
                </details>
              )}
              <p className="event-language">
                {t('spokenLanguage')}:{' '}
                {event.languages.length
                  ? event.languages.join(' / ')
                  : t('languageUnknown')}
              </p>
              <div className="event-actions">
                {event.coordinates ? (
                  <button type="button" onClick={() => select(event.id)}>
                    {t('showOnMap')}
                  </button>
                ) : (
                  <span>{t('noCoordinates')}</span>
                )}
                <a
                  href={event.bookingUrl ?? event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('visitSource')} ↗
                </a>
              </div>
              <p className="event-source">
                {event.sources.map((source) => source.provider).join(' · ')} ·{' '}
                {t('verified', { date: date(event.sources[0].checkedAt) })}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
