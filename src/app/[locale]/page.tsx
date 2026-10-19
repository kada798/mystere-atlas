import { getTranslations } from 'next-intl/server';
import { DebugPanel } from '@/components/debug-panel';
import { Link } from '@/i18n/navigation';

const sections = ['works', 'events', 'community', 'culture'] as const;

export default async function HomePage() {
  const t = await getTranslations('Home');
  const modules = await getTranslations('Modules');

  return (
    <>
      <section className="hero">
        <p className="eyebrow">MYSTÈRE ATLAS — ZH / EN / FR</p>
        <h1>{t('title')}</h1>
        <p className="hero-description">{t('description')}</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/works">
            {t('explore')}
          </Link>
          <Link className="button" href="/events">
            {t('meet')}
          </Link>
        </div>
        <p className="development-note">{t('status')}</p>
      </section>
      <section className="modules" aria-labelledby="modules-heading">
        <div className="section-heading">
          <p className="eyebrow">THE NEXT CHAPTER</p>
          <h2 id="modules-heading">{t('modules')}</h2>
        </div>
        <div className="module-grid">
          {sections.map((section, index) => (
            <Link className="module-link" key={section} href={`/${section}`}>
              <span className="module-index">0{index + 1}</span>
              <h3>{modules(`${section}.title`)}</h3>
              <p>{modules(`${section}.description`)}</p>
              <span className="module-status">
                {t('planned')} <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </>
  );
}
