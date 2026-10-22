'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const labels = { zh: '中文', en: 'English', fr: 'Français' };

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Navigation');
  const dropdown = useRef<HTMLDetailsElement>(null);
  const href = pathname + (searchParams.size ? `?${searchParams}` : '');

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!dropdown.current?.contains(event.target as Node) && dropdown.current)
        dropdown.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return (
    <nav aria-label={t('languages')} className="language-switcher">
      <details
        ref={dropdown}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && dropdown.current?.open) {
            dropdown.current.open = false;
            dropdown.current.querySelector('summary')?.focus();
          }
        }}
      >
        <summary aria-label={t('languages')}>
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" />
            <path d="M2.5 10h15M10 2.5c4 4 4 11 0 15-4-4-4-11 0-15Z" />
          </svg>
          {labels[locale as keyof typeof labels]}
          <span className="language-chevron" aria-hidden="true">
            ⌄
          </span>
        </summary>
        <div className="language-options">
          {routing.locales.map((language) => (
            <Link
              key={language}
              href={href}
              locale={language}
              hrefLang={language}
              aria-current={locale === language ? 'page' : undefined}
              onClick={() => {
                if (dropdown.current) dropdown.current.open = false;
              }}
            >
              {labels[language]}
              {locale === language && <span aria-hidden="true">✓</span>}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
