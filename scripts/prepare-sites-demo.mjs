import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Copy only application source and public catalog data into an isolated Sites
// checkout. The main Next.js project, Git history and credentials stay here.
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'tmp', 'sites', 'mystere-atlas-demo');
const relative = path.relative(root, target);
if (relative !== path.join('tmp', 'sites', 'mystere-atlas-demo'))
  throw new Error('Unexpected deployment directory');
const hosting = JSON.parse(
  await readFile(path.join(target, '.openai', 'hosting.json'), 'utf8'),
);
if (!hosting.project_id)
  throw new Error('Register the Site before preparing it');

await rm(path.join(target, 'app'), { recursive: true, force: true });
await cp(path.join(root, 'src'), path.join(target, 'src'), { recursive: true });
await cp(path.join(root, 'messages'), path.join(target, 'messages'), {
  recursive: true,
});

const snapshot = JSON.parse(
  await readFile(path.join(root, '.data', 'snapshot.json'), 'utf8'),
);
const dates = snapshot.sources
  .map((source) => source.lastSuccessAt)
  .filter(Boolean);
const snapshotDate = dates.sort().at(-1)?.slice(0, 10) ?? '2026-10-20';
await mkdir(path.join(target, 'src', 'data'), { recursive: true });
await writeFile(
  path.join(target, 'src', 'data', 'demo-snapshot.json'),
  `${JSON.stringify(snapshot)}\n`,
);
await writeFile(
  path.join(target, 'src', 'features', 'ingestion', 'store.server.ts'),
  `import snapshot from '../../data/demo-snapshot.json';
import type { StoredData } from './types';
// Public, dated reference data is bundled into the Worker; no local filesystem,
// credentials or private user records are sent to the hosting platform.
export async function readStoredData(): Promise<StoredData> {
  return snapshot as StoredData;
}
`,
);

const requestFile = path.join(target, 'src', 'i18n', 'request.ts');
const request = (await readFile(requestFile, 'utf8'))
  .replace("import * as rootParams from 'next/root-params';\n", '')
  .replace(
    '{ locale: explicitLocale }',
    '{ locale: explicitLocale, requestLocale }',
  )
  .replace('await rootParams.locale()', 'await requestLocale');
await writeFile(requestFile, request);
// The hosted runtime also supports Next 16's proxy convention.
await rm(path.join(target, 'src', 'middleware.ts'), { force: true });
// Use document navigation for cross-locale links in the hosted compatibility
// runtime. This preserves the actual path and filters without stale RSC locales.
await writeFile(
  path.join(target, 'src', 'components', 'language-switcher.tsx'),
  `'use client';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import { routing } from '@/i18n/routing';
const labels = { zh: '中文', en: 'English', fr: 'Français' };
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('Navigation');
  const route = pathname.replace(/^\\/(?:zh|en|fr)(?=\\/|$)/, '') || '/';
  const query = params.toString();
  return <nav aria-label={t('languages')} className="language-switcher">
    {routing.locales.map(language => <a key={language}
      href={'/' + language + (route === '/' ? '' : route) + (query ? '?' + query : '')}
      hrefLang={language} aria-current={locale === language ? 'page' : undefined}>
      {labels[language]}
    </a>)}
  </nav>;
}
`,
);
await writeFile(
  path.join(target, 'src', 'components', 'hosted-link.tsx'),
  `'use client';
import { useLocale } from 'next-intl';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string | { pathname: string; query?: Record<string, string | string[] | number | boolean | null | undefined> };
  locale?: string; scroll?: boolean; children?: ReactNode;
};
export function HostedLink({ href, locale, scroll: _scroll, ...props }: Props) {
  const currentLocale = useLocale();
  const language = locale ?? currentLocale;
  let target: string;
  if (typeof href === 'string') target = href;
  else {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(href.query ?? {})) {
      if (value == null) continue;
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, String(item));
    }
    target = href.pathname + (query.size ? '?' + query.toString() : '');
  }
  const localized = target.startsWith('/') && !target.startsWith('//')
    ? '/' + language + (target === '/' ? '' : target.replace(/^\\/(?:zh|en|fr)(?=\\/|$)/, ''))
    : target;
  return <a href={localized} {...props} />;
}
`,
);
await writeFile(
  path.join(target, 'src', 'i18n', 'navigation.ts'),
  `import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';
export const { redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
export { HostedLink as Link } from '@/components/hosted-link';
`,
);
const workerFile = path.join(target, 'worker', 'index.ts');
let worker = await readFile(workerFile, 'utf8');
if (!worker.includes('unsupportedLocale')) {
  worker = worker.replace(
    'let binding = ctx.props?.CONNECTORS;',
    `const unsupportedLocale = new URL(request.url).pathname.match(/^\\/([a-z]{2})(?:\\/|$)/)?.[1];
    if (unsupportedLocale && !['zh', 'en', 'fr'].includes(unsupportedLocale))
      return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    let binding = ctx.props?.CONNECTORS;`,
  );
  await writeFile(workerFile, worker);
}

const copy = {
  zh: {
    status: '公开 MVP 演示 · 中文 / English / Français',
    home: `公开演示版：作品与巴黎活动使用 ${snapshotDate} 获取的数据快照。账号、个人清单和站内报名仍在开发。`,
    pending: '此模块正在开发中；当前可体验作品检索和巴黎活动地图。',
    banner: `MVP 演示 · 数据快照 ${snapshotDate} · 活动场次以原站为准`,
  },
  en: {
    status: 'Public MVP demo · 中文 / English / Français',
    home: `Public demo: works and Paris events use a data snapshot fetched on ${snapshotDate}. Accounts, personal lists and on-site registration are still in development.`,
    pending:
      'This module is in development. Explore the works catalog and Paris events map in this demo.',
    banner: `MVP demo · Data snapshot ${snapshotDate} · Confirm event sessions with the organizer`,
  },
  fr: {
    status: 'Démo publique du MVP · 中文 / English / Français',
    home: `Démo publique : les œuvres et événements parisiens utilisent un instantané obtenu le ${snapshotDate}. Comptes, listes personnelles et inscriptions sur le site sont en développement.`,
    pending:
      'Ce module est en développement. Découvrez le catalogue et la carte des événements parisiens dans cette démo.',
    banner: `Démo MVP · Données du ${snapshotDate} · Vérifiez les séances auprès de l’organisateur`,
  },
};
for (const [locale, content] of Object.entries(copy)) {
  const file = path.join(target, 'messages', `${locale}.json`);
  const messages = JSON.parse(await readFile(file, 'utf8'));
  messages.Footer.status = content.status;
  messages.Home.status = content.home;
  messages.Modules.pending = content.pending;
  messages.Demo = { notice: content.banner };
  await writeFile(file, `${JSON.stringify(messages, null, 2)}\n`);
}
const layoutFile = path.join(target, 'src', 'app', '[locale]', 'layout.tsx');
const layout = (await readFile(layoutFile, 'utf8'))
  .replace(
    "const t = await getTranslations('Footer');",
    "const t = await getTranslations('Footer');\n  const demo = await getTranslations('Demo');",
  )
  .replace(
    '<SiteHeader />',
    '<SiteHeader />\n          <aside className="demo-notice">{demo(\'notice\')}</aside>',
  );
await writeFile(layoutFile, layout);
const cssFile = path.join(target, 'src', 'app', 'globals.css');
await writeFile(
  cssFile,
  `${await readFile(cssFile, 'utf8')}\n.demo-notice { width: min(1120px, calc(100% - 64px)); margin: 14px auto 0; color: var(--muted); font-size: 11px; }\n`,
);

const packageFile = path.join(target, 'package.json');
const manifest = JSON.parse(await readFile(packageFile, 'utf8'));
manifest.name = 'mystere-atlas-public-demo';
Object.assign(manifest.dependencies, {
  'next-intl': '4.14.9',
  leaflet: '1.9.4',
});
manifest.devDependencies['@types/leaflet'] = '1.9.22';
await writeFile(packageFile, `${JSON.stringify(manifest, null, 2)}\n`);

const tsconfigFile = path.join(target, 'tsconfig.json');
const tsconfig = JSON.parse(await readFile(tsconfigFile, 'utf8'));
tsconfig.compilerOptions.paths = { '@/*': ['./src/*'] };
await writeFile(tsconfigFile, `${JSON.stringify(tsconfig, null, 2)}\n`);
await writeFile(
  path.join(target, 'next.config.ts'),
  `import type { NextConfig } from 'next';\nconst nextConfig: NextConfig = { reactStrictMode: true };\nexport default nextConfig;\n`,
);
const viteFile = path.join(target, 'vite.config.ts');
let vite = await readFile(viteFile, 'utf8');
if (!vite.includes('next-intl/config')) {
  vite = `import { fileURLToPath } from 'node:url';\n${vite}`;
  vite = vite.replace(
    'return {\n    server:',
    `return {\n    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), 'next-intl/config': fileURLToPath(new URL('./src/i18n/request.ts', import.meta.url)) } },\n    server:`,
  );
}
await writeFile(viteFile, vite);
await writeFile(
  path.join(target, 'README.md'),
  `# Mystère Atlas public MVP\n\nThis isolated hosting checkout is generated from the private Next.js development project with scripts/prepare-sites-demo.mjs. It uses a dated public-data snapshot (${snapshotDate}), not a running cloud ingestion service. Authentication, personal lists and on-site registrations are not implemented. Source attribution and license notes are shown in the interface.\n`,
);
console.log(
  JSON.stringify({
    target,
    project_id: hosting.project_id,
    works: snapshot.catalog.works.length,
    events: snapshot.events.length,
    snapshotDate,
  }),
);
