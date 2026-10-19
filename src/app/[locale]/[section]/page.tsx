import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const sections = ['works', 'events', 'community', 'culture'] as const;

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  const key = section as (typeof sections)[number];
  const t = await getTranslations('Modules');

  return (
    <section className="placeholder">
      <p className="eyebrow">MYSTÈRE ATLAS / MVP</p>
      <h1>{t(`${key}.title`)}</h1>
      <p className="hero-description">{t(`${key}.description`)}</p>
      <p className="development-note">{t('pending')}</p>
      <Link className="button" href="/">
        {t('back')}
      </Link>
    </section>
  );
}
