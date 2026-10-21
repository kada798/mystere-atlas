import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';

const sections = ['works', 'events', 'community', 'culture'] as const;

export async function SiteHeader() {
  const t = await getTranslations('Navigation');

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          MA
        </span>
        <span>
          Mystère Atlas<span className="brand-caption">{t('tagline')}</span>
        </span>
      </Link>
      <nav className="main-nav" aria-label={t('main')}>
        {sections.map((section) => (
          <Link key={section} href={`/${section}`}>
            {t(section)}
          </Link>
        ))}
      </nav>
      <Suspense
        fallback={
          <span className="language-switcher">中文 · English · Français</span>
        }
      >
        <LanguageSwitcher />
      </Suspense>
    </header>
  );
}
