import * as rootParams from 'next/root-params';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const locale = explicitLocale ?? (await rootParams.locale());

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return {
    locale,
    messages: {
      ...(await import(`../../messages/${locale}.json`)).default,
      Catalog: (await import(`../../messages/catalog/${locale}.json`)).default,
      Events: (await import(`../../messages/events/${locale}.json`)).default,
      Sources: (await import(`../../messages/sources/${locale}.json`)).default,
    },
    timeZone: 'Europe/Paris',
  };
});
