import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getCatalogSnapshot } from '@/features/catalog/repository.server';
import { WorkDetail } from '@/features/catalog/components/work-detail';
import { routing } from '@/i18n/routing';

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const data = await getCatalogSnapshot();
  const work = data.works.find((record) => record.id === id);
  if (!work) notFound();
  return <WorkDetail work={work} data={data} locale={locale} />;
}
