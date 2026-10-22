import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/site-header';
import { routing } from '@/i18n/routing';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: { default: 'Mystère Atlas · 谜图', template: '%s | Mystère Atlas' },
    description: t('description'),
    applicationName: 'Mystère Atlas',
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    openGraph: {
      title: 'Mystère Atlas · 谜图',
      description: t('description'),
      siteName: 'Mystère Atlas',
      type: 'website',
      locale: { zh: 'zh_CN', en: 'en_US', fr: 'fr_FR' }[locale],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations('Footer');

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <footer className="site-footer">
            <span>Mystère Atlas</span>
            <span>{t('status')}</span>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
