import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { CatalogExplorer } from '@/features/catalog/components/catalog-explorer';
import { getCatalogSnapshot } from '@/features/catalog/repository.server';
import { parseCatalogQuery } from '@/features/catalog/query';
import type { SearchParameters } from '@/features/catalog/types';
import { routing } from '@/i18n/routing';

export default async function WorksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParameters>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const query = parseCatalogQuery(await searchParams);
  return (
    <CatalogExplorer
      locale={locale}
      query={query}
      data={await getCatalogSnapshot()}
    />
  );
}
