import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh', 'en', 'fr'],
  defaultLocale: 'zh',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
