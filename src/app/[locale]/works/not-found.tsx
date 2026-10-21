import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function WorkNotFound() {
  const t = await getTranslations('Catalog');
  return (
    <section className="placeholder">
      <p className="eyebrow">MYSTÈRE ATLAS / 404</p>
      <h1>{t('notFoundTitle')}</h1>
      <p className="hero-description">{t('notFoundDescription')}</p>
      <Link className="button" href="/works">
        {t('back')}
      </Link>
    </section>
  );
}
