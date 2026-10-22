import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { detailFields } from '../config';
import { entityTitle, safeExternalUrl } from '../query';
import type { CatalogSnapshot, Work } from '../types';
import { workIntroduction } from '../media';
import { WorkCover } from './work-cover';

export async function WorkDetail({
  work,
  data,
  locale,
}: {
  work: Work;
  data: CatalogSnapshot;
  locale: Locale;
}) {
  const t = await getTranslations('Catalog');
  const introduction = workIntroduction(work, locale);
  const versions = data.versions.filter(
    (version) => version.workId === work.id,
  );
  const offers = data.availability.filter((offer) => offer.workId === work.id);
  const series = data.series.find((record) => record.id === work.seriesId);
  const relations = data.relations.filter(
    (relation) => relation.fromId === work.id || relation.toId === work.id,
  );
  const roles = [
    'author',
    'director',
    'writer',
    'translator',
    'cast',
    'creator',
  ];
  const languageName = (code: string) => {
    if (code === 'und' || code === 'root')
      return t('detail.unspecifiedLanguage');
    try {
      return (
        new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code
      );
    } catch {
      return t('detail.unspecifiedLanguage');
    }
  };
  const names = work.names.filter(
    (name) =>
      !['und', 'root'].includes(name.language) ||
      !work.names.some(
        (other) =>
          !['und', 'root'].includes(other.language) &&
          other.title === name.title,
      ),
  );
  return (
    <article className="work-detail">
      <Link className="catalog-text-link" href="/works">
        ← {t('back')}
      </Link>
      <header className="catalog-hero work-hero">
        <div className="work-hero-copy">
          <p className="eyebrow">{t(`types.${work.kind}`)}</p>
          <h1>{entityTitle(work, locale)}</h1>
          {work.firstReleaseDate && (
            <p className="work-release">{work.firstReleaseDate}</p>
          )}
          {work.summaries[locale] && (
            <p className="catalog-intro">{work.summaries[locale]}</p>
          )}
        </div>
        <figure className="work-cover">
          <WorkCover
            key={work.cover?.url ?? work.id}
            url={work.cover?.url}
            alt={t('detail.coverAlt', { title: entityTitle(work, locale) })}
            missing={t('detail.coverMissing')}
          />
          {work.cover && (
            <figcaption>
              <a
                href={safeExternalUrl(work.cover.source.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {work.cover.source.provider} ↗
              </a>
              {work.cover.credit && <span>{work.cover.credit}</span>}
              {work.cover.license && <span>{work.cover.license}</span>}
            </figcaption>
          )}
        </figure>
      </header>
      <section
        className="work-introduction"
        aria-labelledby="work-introduction-title"
      >
        <h2 id="work-introduction-title">{t('detail.introduction')}</h2>
        {introduction ? (
          <>
            {introduction.language !== locale && (
              <p className="work-introduction-language">
                {t('detail.originalText', {
                  language: languageName(introduction.language),
                })}
              </p>
            )}
            <p className="work-introduction-text" lang={introduction.language}>
              {introduction.text}
            </p>
            <p className="work-introduction-source">
              {t(
                introduction.excerpt
                  ? 'detail.excerptFrom'
                  : 'detail.adaptedFrom',
              )}{' '}
              <a
                href={safeExternalUrl(introduction.source.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {introduction.source.provider} ↗
              </a>
              {introduction.license && ` · ${introduction.license}`}
            </p>
          </>
        ) : (
          <p>{t('detail.introductionMissing')}</p>
        )}
      </section>
      <section>
        <h2>{t('detail.about')}</h2>
        <dl className="work-facts">
          <div>
            <dt>{t('detail.originalLanguage')}</dt>
            <dd>
              {work.originalLanguage
                ? languageName(work.originalLanguage)
                : t('unknown')}
            </dd>
          </div>
          {detailFields[work.kind].map((field) => {
            let value: string | number | string[] | undefined =
              work.details[field];
            if (roles.includes(field))
              value = work.credits
                .filter((credit) => credit.role === field)
                .flatMap((credit) => {
                  const person = data.people.find(
                    (record) => record.id === credit.personId,
                  );
                  return person ? [entityTitle(person, locale)] : [];
                });
            if (field === 'series')
              value = series ? entityTitle(series, locale) : undefined;
            if (field === 'translator')
              value = [
                ...new Set(
                  versions.flatMap((version) => version.translatorIds),
                ),
              ].flatMap((id) => {
                const person = data.people.find((record) => record.id === id);
                return person ? [entityTitle(person, locale)] : [];
              });
            if (field === 'release') value = work.firstReleaseDate;
            if (field === 'languages')
              value = [
                ...new Set(
                  versions.flatMap((version) => [
                    version.language,
                    ...version.subtitleLanguages,
                  ]),
                ),
              ].map(languageName);
            if (field === 'city' || field === 'venue')
              value = offers.flatMap((offer) => {
                const place = data.places.find(
                  (record) => record.id === offer.placeId,
                );
                return place
                  ? [field === 'city' ? place.city : entityTitle(place, locale)]
                  : [];
              });
            return (
              <div key={field}>
                <dt>{t(`fields.${field}`)}</dt>
                <dd>
                  {Array.isArray(value)
                    ? value.join(' / ') || t('unknown')
                    : (value ?? t('unknown'))}
                </dd>
              </div>
            );
          })}
          <div className="work-fact-titles">
            <dt>{t('detail.names')}</dt>
            <dd>
              <ul className="work-inline-list">
                {names.map((name, index) => (
                  <li key={`${name.language}-${index}`}>
                    {languageName(name.language)} · {name.title}
                    {name.aliases?.length
                      ? ` / ${name.aliases.join(' / ')}`
                      : ''}
                    {name.official === false
                      ? ` (${t('unofficialTitle')})`
                      : ''}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="work-fact-versions">
            <dt>{t('detail.versions')}</dt>
            <dd>
              {versions.length ? (
                <details className="work-editions">
                  <summary>
                    {t('detail.versionCount', { count: versions.length })}
                  </summary>
                  <ul className="work-inline-list">
                    {versions.map((version) => (
                      <li key={version.id}>
                        {version.title ?? entityTitle(work, locale)} ·{' '}
                        {languageName(version.language)}
                        {version.translatorIds.length > 0 && (
                          <span>
                            {' '}
                            · {t('fields.translator')} :{' '}
                            {version.translatorIds
                              .map((id) => {
                                const person = data.people.find(
                                  (record) => record.id === id,
                                );
                                return person
                                  ? entityTitle(person, locale)
                                  : t('unknown');
                              })
                              .join(' / ')}
                          </span>
                        )}
                        {version.subtitleLanguages.length > 0 && (
                          <span>
                            {' '}
                            · {t('fields.languages')} :{' '}
                            {version.subtitleLanguages
                              .map(languageName)
                              .join(' / ')}
                          </span>
                        )}
                        {version.releaseDate ? ` · ${version.releaseDate}` : ''}
                        {version.identifier
                          ? ` · ${version.identifier.kind.toUpperCase()} ${version.identifier.value}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                t('detail.noVersions')
              )}
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h2>{t('detail.availability')}</h2>
        {offers.length ? (
          <ul>
            {offers.map((offer) => {
              const url = safeExternalUrl(offer.url);
              return (
                <li key={offer.id}>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {offer.provider} ↗
                    </a>
                  ) : (
                    offer.provider
                  )}{' '}
                  · {offer.region} ·{' '}
                  {offer.languages.map(languageName).join(' / ')} ·{' '}
                  {t('detail.checked', { date: offer.checkedAt })}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{t('detail.noAvailability')}</p>
        )}
      </section>
      <section>
        <h2>{t('detail.relations')}</h2>
        {relations.length ? (
          <ul>
            {relations.map((relation) => {
              const related = data.works.find(
                (record) =>
                  record.id ===
                  (relation.fromId === work.id
                    ? relation.toId
                    : relation.fromId),
              );
              return related ? (
                <li
                  key={`${relation.fromId}-${relation.toId}-${relation.kind}`}
                >
                  {t(`relationKinds.${relation.kind}`)} ·{' '}
                  <Link href={`/works/${related.id}`}>
                    {entityTitle(related, locale)}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        ) : (
          <p>{t('detail.noRelations')}</p>
        )}
      </section>
      <section>
        <h2>{t('detail.sources')}</h2>
        {work.sources.length ? (
          <ul>
            {work.sources.map((source) => {
              const url = safeExternalUrl(source.url);
              return (
                <li key={`${source.provider}-${source.externalId}`}>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {source.provider} ↗
                    </a>
                  ) : (
                    source.provider
                  )}{' '}
                  · {t('detail.checked', { date: source.checkedAt })}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{t('detail.noSources')}</p>
        )}
      </section>
      {Boolean(work.externalLinks?.length) && (
        <section>
          <h2>{t('detail.externalLinks')}</h2>
          <p>{t('detail.externalLinksNote')}</p>
          <ul>
            {work.externalLinks?.map((link) => {
              const url = safeExternalUrl(link.url);
              return url ? (
                <li key={link.provider}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {link.provider} ↗
                  </a>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
