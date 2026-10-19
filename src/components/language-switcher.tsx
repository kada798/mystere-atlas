'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const labels = { zh: '中文', en: 'English', fr: 'Français' };

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Navigation');

  return (
    <nav aria-label={t('languages')} className="language-switcher">
      {routing.locales.map((language) => (
        <Link
          key={language}
          href={pathname}
          locale={language}
          hrefLang={language}
          aria-current={locale === language ? 'page' : undefined}
        >
          {labels[language]}
        </Link>
      ))}
    </nav>
  );
}
