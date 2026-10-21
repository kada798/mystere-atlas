import { getLocale, getTranslations } from 'next-intl/server';
import { readStoredData } from './store.server';
import { sourceDefinitions } from './sources';
import './sources.css';

export async function SourcePanel({ scope }: { scope: 'catalog' | 'events' }) {
  const [data, t, locale] = await Promise.all([
    readStoredData(),
    getTranslations('Sources'),
    getLocale(),
  ]);
  const definitions = sourceDefinitions.filter(
    (source) => source.scope === scope,
  );
  const ready = definitions.filter((source) =>
    data.sources.some(
      (status) => status.id === source.id && status.state === 'ready',
    ),
  ).length;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date(value));
  return (
    <details className="source-panel">
      <summary>
        {t('title')}
        <span>{t('connected', { ready, total: definitions.length })}</span>
      </summary>
      <p>{t('description')}</p>
      <ul>
        {definitions.map((definition) => {
          const status = data.sources.find(
            (source) => source.id === definition.id,
          );
          const state = status?.state ?? definition.initial;
          return (
            <li key={definition.id}>
              <div>
                <a
                  href={definition.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {definition.name} ↗
                </a>
                <span className={`source-state source-${state}`}>
                  {t(`states.${state}`)}
                </span>
              </div>
              <p>{t(`notes.${definition.id}`)}</p>
              {status?.lastSuccessAt && (
                <small>
                  {t('updated', {
                    date: date(status.lastSuccessAt),
                    count: status.count,
                  })}
                </small>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
