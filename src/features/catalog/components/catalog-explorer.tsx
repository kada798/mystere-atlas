import { getTranslations } from 'next-intl/server';
import { SourcePanel } from '@/features/ingestion/source-panel';
import { Link, getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  contentLanguages,
  detailFields,
  languages,
  regions,
  views,
  workTypes,
} from '../config';
import {
  catalogParameters,
  changeCatalogView,
  entityTitle,
  selectRelatedEntities,
  selectWorks,
} from '../query';
import type { CatalogQuery, CatalogSnapshot } from '../types';

export async function CatalogExplorer({
  locale,
  query,
  data,
}: {
  locale: Locale;
  query: CatalogQuery;
  data: CatalogSnapshot;
}) {
  const t = await getTranslations('Catalog');
  const works = selectWorks(data, query, locale);
  const entities =
    query.view === 'works' ? [] : selectRelatedEntities(data, query);
  const count = query.view === 'works' ? works.length : entities.length;
  const hasPublishedRecords = data[query.view].length > 0;
  const selectedTypes = query.type === 'all' ? workTypes : [query.type];
  const href = (next: CatalogQuery) => ({
    pathname: '/works',
    query: catalogParameters(next),
  });
  const languageName = (code: string) =>
    new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code;
  const regionName = (code: string) =>
    new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;

  return (
    <div className="catalog-page">
      <header className="catalog-hero">
        <div>
          <p className="eyebrow">MYSTÈRE ATLAS / THE MYSTERY INDEX</p>
          <h1>{t('title')}</h1>
          <p className="catalog-intro">{t('intro')}</p>
        </div>
        <div className="catalog-stamp">
          <span className="catalog-dot" />
          {data.works.length
            ? t('collectionCount', { count: data.works.length })
            : t('preparing')}
        </div>
      </header>
      <SourcePanel scope="catalog" />

      <nav className="catalog-views" aria-label={t('entityNavigation')}>
        {views.map((view) => (
          <Link
            key={view}
            href={href(changeCatalogView(query, view))}
            aria-current={query.view === view ? 'page' : undefined}
            scroll={false}
          >
            {t(`views.${view}`)}
          </Link>
        ))}
      </nav>

      {query.view === 'works' && (
        <section className="catalog-types" aria-label={t('typeNavigation')}>
          <Link
            className="catalog-type-all"
            href={href({ ...query, type: 'all' })}
            aria-current={query.type === 'all' ? 'page' : undefined}
            scroll={false}
          >
            {t('allWorks')}
            <span aria-hidden="true">↗</span>
          </Link>
          <div className="catalog-type-grid">
            {workTypes.map((type, index) => (
              <Link
                key={type}
                href={href({ ...query, type })}
                className="catalog-type"
                aria-current={query.type === type ? 'page' : undefined}
                scroll={false}
              >
                <span className="catalog-type-number">0{index + 1}</span>
                <strong>{t(`types.${type}`)}</strong>
                <span className="catalog-type-caption">
                  {t(`typeShort.${type}`)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section
        className="catalog-search"
        aria-labelledby="catalog-search-heading"
      >
        <h2 id="catalog-search-heading">{t(`searchTitles.${query.view}`)}</h2>
        <form
          method="get"
          action={getPathname({ locale, href: '/works' })}
          key={JSON.stringify(query)}
        >
          <input type="hidden" name="view" value={query.view} />
          {query.type !== 'all' && (
            <input type="hidden" name="type" value={query.type} />
          )}
          <div className="catalog-search-row">
            <label className="catalog-search-input">
              <span className="visually-hidden">{t('searchLabel')}</span>
              <input
                type="search"
                name="q"
                maxLength={160}
                defaultValue={query.q}
                placeholder={t(`searchPlaceholders.${query.view}`)}
              />
            </label>
            <button type="submit" className="button button-primary">
              {t('search')}
            </button>
          </div>
          <div className="catalog-filters">
            <label>
              {t('contentLanguage')}
              <select
                name="contentLanguage"
                defaultValue={query.contentLanguage}
              >
                <option value="all">{t('allLanguages')}</option>
                {contentLanguages.map((code) => (
                  <option key={code} value={code}>
                    {languageName(code)}
                  </option>
                ))}
              </select>
            </label>
            {['works', 'places'].includes(query.view) && (
              <>
                <label>
                  {t(
                    query.view === 'works'
                      ? 'versionLanguage'
                      : 'experienceLanguage',
                  )}
                  <select
                    name="versionLanguage"
                    defaultValue={query.versionLanguage}
                  >
                    <option value="all">{t('allLanguages')}</option>
                    {languages.map((code) => (
                      <option key={code} value={code}>
                        {languageName(code)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('region')}
                  <select name="region" defaultValue={query.region}>
                    <option value="all">{t('allRegions')}</option>
                    {regions.map((code) => (
                      <option key={code} value={code}>
                        {regionName(code)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {query.view === 'works' && (
              <label>
                {t('sort')}
                <select name="sort" defaultValue={query.sort}>
                  <option value="added">{t('sorts.added')}</option>
                  <option value="title">{t('sorts.title')}</option>
                  <option value="release">{t('sorts.release')}</option>
                </select>
              </label>
            )}
            <Link
              className="catalog-reset"
              href={href(
                changeCatalogView(
                  { ...query, q: '', contentLanguage: 'all' },
                  query.view,
                ),
              )}
              scroll={false}
            >
              {t('reset')}
            </Link>
          </div>
          <p className="catalog-filter-hint">{t('languageHint')}</p>
        </form>
      </section>

      <section
        className="catalog-results"
        aria-labelledby="catalog-results-heading"
      >
        <div className="catalog-result-heading">
          <h2 id="catalog-results-heading">
            {query.view === 'works' && query.type !== 'all'
              ? t(`types.${query.type}`)
              : t(`views.${query.view}`)}
          </h2>
          <span>{t('resultCount', { count })}</span>
        </div>
        {count === 0 ? (
          <div className="catalog-empty">
            <span className="catalog-empty-mark" aria-hidden="true">
              MA
            </span>
            <p className="eyebrow">{t('emptyEyebrow')}</p>
            <h3>
              {t(
                hasPublishedRecords
                  ? 'noMatchesTitle'
                  : `emptyTitles.${query.view}`,
              )}
            </h3>
            <p>
              {t(
                hasPublishedRecords
                  ? 'noMatchesDescription'
                  : `emptyDescriptions.${query.view}`,
              )}
            </p>
            {(query.q ||
              query.type !== 'all' ||
              query.contentLanguage !== 'all' ||
              query.region !== 'all' ||
              query.versionLanguage !== 'all') && (
              <Link
                className="catalog-text-link"
                href={href(
                  changeCatalogView(
                    { ...query, q: '', contentLanguage: 'all' },
                    query.view,
                  ),
                )}
                scroll={false}
              >
                {t('reset')} →
              </Link>
            )}
          </div>
        ) : (
          <div className="catalog-record-grid">
            {query.view === 'works'
              ? works.map((work) => (
                  <article key={work.id} className="catalog-record">
                    <p className="eyebrow">{t(`types.${work.kind}`)}</p>
                    <h3>
                      <Link href={`/works/${work.id}`}>
                        {entityTitle(work, locale)}
                      </Link>
                    </h3>
                    <p>{work.summaries[locale] ?? t('summaryMissing')}</p>
                  </article>
                ))
              : entities.map((entity) => (
                  <article key={entity.id} className="catalog-record">
                    <h3>{entityTitle(entity, locale)}</h3>
                    <p>{entity.summaries[locale] ?? t('summaryMissing')}</p>
                  </article>
                ))}
          </div>
        )}
      </section>

      {query.view === 'works' && (
        <section
          className="catalog-fields"
          aria-labelledby="catalog-fields-heading"
        >
          <div className="catalog-section-heading">
            <p className="eyebrow">{t('guideEyebrow')}</p>
            <h2 id="catalog-fields-heading">{t('fieldsTitle')}</h2>
            <p>{t('fieldsDescription')}</p>
          </div>
          <div className="catalog-field-grid">
            {selectedTypes.map((type) => (
              <details key={type}>
                <summary>
                  {t(`types.${type}`)}
                  <span aria-hidden="true">＋</span>
                </summary>
                <p>{t(`typeDescriptions.${type}`)}</p>
                <ul>
                  {detailFields[type].map((field) => (
                    <li key={field}>{t(`fields.${field}`)}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}

      <section
        className="catalog-connections"
        aria-labelledby="catalog-connections-heading"
      >
        <div className="catalog-section-heading">
          <p className="eyebrow">{t('connectionsEyebrow')}</p>
          <h2 id="catalog-connections-heading">{t('connectionsTitle')}</h2>
        </div>
        <div className="catalog-connection-grid">
          {(['versions', 'adaptations', 'series', 'places'] as const).map(
            (connection, index) => (
              <div key={connection}>
                <span className="catalog-type-number">0{index + 1}</span>
                <h3>{t(`connections.${connection}.title`)}</h3>
                <p>{t(`connections.${connection}.description`)}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
