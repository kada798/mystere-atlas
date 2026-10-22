import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'tmp', 'pages-demo');
const basePath =
  process.argv.find((v) => v.startsWith('--base-path='))?.slice(12) ??
  '/mystere-atlas';
const snapshotPath = path.resolve(
  root,
  process.argv.find((v) => v.startsWith('--snapshot='))?.slice(11) ??
    'deployment/public-snapshot.json',
);
if (basePath && !/^\/[a-z0-9][a-z0-9-]*$/.test(basePath))
  throw new Error('Expected one repository path');
if (path.relative(root, target) !== path.join('tmp', 'pages-demo'))
  throw new Error('Unexpected demo directory');
await mkdir(target, { recursive: true });
// Recreate only the generated frontend; keep installed dependencies for local checks.
await rm(path.join(target, 'src'), { recursive: true, force: true });
const put = async (file, text) => {
  await mkdir(path.dirname(path.join(target, file)), { recursive: true });
  await writeFile(path.join(target, file), text);
};
for (const dir of [
  'app',
  'components',
  'i18n',
  'features/catalog',
  'features/events',
]) {
  const source = path.join(root, 'src', dir);
  await cp(source, path.join(target, 'src', dir), {
    recursive: true,
    filter: (file) =>
      !path.relative(source, file).split(path.sep).includes('api'),
  });
}
for (const file of [
  'source-panel.tsx',
  'sources.ts',
  'sources.css',
  'types.ts',
]) {
  await mkdir(path.join(target, 'src/features/ingestion'), { recursive: true });
  await cp(
    path.join(root, 'src/features/ingestion', file),
    path.join(target, 'src/features/ingestion', file),
  );
}
await cp(path.join(root, 'messages'), path.join(target, 'messages'), {
  recursive: true,
});
const homeFile = path.join(target, 'src/app/[locale]/page.tsx');
await writeFile(
  homeFile,
  (await readFile(homeFile, 'utf8'))
    .replace("import { DebugPanel } from '@/components/debug-panel';\n", '')
    .replace(
      "      {process.env.NODE_ENV === 'development' && <DebugPanel />}\n",
      '',
    ),
);
await rm(path.join(target, 'src/components/debug-panel.tsx'), { force: true });
const raw = JSON.parse(await readFile(snapshotPath, 'utf8'));
const snapshot = {
  version: 1,
  catalog: raw.catalog,
  events: raw.events,
  sources: raw.sources.map((source) => {
    const publicSource = { ...source };
    delete publicSource.detail;
    return publicSource;
  }),
};
if (!snapshot.catalog.works.length || !snapshot.events.length)
  throw new Error('A real public snapshot is required');
const date = snapshot.sources
  .map((s) => s.lastSuccessAt)
  .filter(Boolean)
  .sort()
  .at(-1)
  ?.slice(0, 10);
if (!date) throw new Error('Source date is missing');
await put(
  'src/data/public-snapshot.json',
  JSON.stringify(snapshot, null, 2) + '\n',
);
await put(
  'src/features/ingestion/store.server.ts',
  `import snapshot from '@/data/public-snapshot.json';
import type {StoredData} from './types';
export async function readStoredData():Promise<StoredData>{return snapshot as StoredData;}
`,
);
const catalogFile = path.join(
  target,
  'src/features/catalog/components/catalog-explorer.tsx',
);
let catalog = await readFile(catalogFile, 'utf8');
catalog = catalog
  .replace(
    "import { getTranslations } from 'next-intl/server';",
    "'use client';\nimport { useTranslations } from 'next-intl';",
  )
  .replace(
    "import { SourcePanel } from '@/features/ingestion/source-panel';\n",
    '',
  )
  .replace(
    'export async function CatalogExplorer(',
    'export function CatalogExplorer(',
  )
  .replace('  data,\n}: {', '  data,\n  sourcePanel,\n}: {')
  .replace(
    '  data: CatalogSnapshot;',
    '  data: CatalogSnapshot;\n  sourcePanel?: React.ReactNode;',
  )
  .replace("await getTranslations('Catalog')", "useTranslations('Catalog')")
  .replace('<SourcePanel scope="catalog" />', '{sourcePanel}');
if (catalog.includes('getTranslations') || catalog.includes('<SourcePanel'))
  throw new Error('Catalog adapter needs review');
await writeFile(catalogFile, catalog);
await put(
  'src/static/query.ts',
  `import type {SearchParameters} from '@/features/catalog/types';
export function queryParameters(params:Pick<URLSearchParams,'keys'|'getAll'>):SearchParameters{
return Object.fromEntries([...new Set(params.keys())].map(key=>{const v=params.getAll(key);return[key,v.length>1?v:v[0]];}));}
`,
);
await put(
  'src/static/catalog.tsx',
  `'use client';
import {useSearchParams} from 'next/navigation';
import {CatalogExplorer} from '@/features/catalog/components/catalog-explorer';
import {parseCatalogQuery} from '@/features/catalog/query';
import type {CatalogSnapshot} from '@/features/catalog/types';
import type {Locale} from '@/i18n/routing';
import {queryParameters} from './query';
export function StaticCatalog({locale,data,sourcePanel}:{locale:Locale;data:CatalogSnapshot;sourcePanel:React.ReactNode}){
const params=useSearchParams();return <CatalogExplorer locale={locale} data={data} query={parseCatalogQuery(queryParameters(params))} sourcePanel={sourcePanel}/>;}
`,
);
await put(
  'src/app/[locale]/works/page.tsx',
  `import {Suspense} from 'react';
import {hasLocale} from 'next-intl';import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';import {getCatalogSnapshot} from '@/features/catalog/repository.server';
import {SourcePanel} from '@/features/ingestion/source-panel';import {StaticCatalog} from '@/static/catalog';
export default async function WorksPage({params}:{params:Promise<{locale:string}>}){
const {locale}=await params;if(!hasLocale(routing.locales,locale))notFound();
return <Suspense fallback={<p>Mystère Atlas</p>}><StaticCatalog locale={locale} data={await getCatalogSnapshot()} sourcePanel={<SourcePanel scope="catalog"/>}/></Suspense>;}
`,
);
const detail = path.join(target, 'src/app/[locale]/works/[id]/page.tsx');
await writeFile(
  detail,
  (await readFile(detail, 'utf8')) +
    `\nexport const dynamicParams=false;\nexport async function generateStaticParams(){const data=await getCatalogSnapshot();return data.works.map(work=>({id:work.id}));}\n`,
);
const originalEvents = await readFile(
  path.join(root, 'src/app/[locale]/events/page.tsx'),
  'utf8',
);
const markup = originalEvents
  .slice(originalEvents.indexOf('  return ('))
  .replace('<SourcePanel scope="events" />', '{sourcePanel}');
if (!markup.includes('events-page'))
  throw new Error('Events adapter needs review');
await put(
  'src/static/events.tsx',
  `'use client';
import {useTranslations} from 'next-intl';import {useSearchParams} from 'next/navigation';
import {Link,getPathname} from '@/i18n/navigation';import type {Locale} from '@/i18n/routing';
import type {ParisEvent} from '@/features/events/types';
import {eventKinds,parseEventQuery,selectEvents} from '@/features/events/query';
import {EventsResults} from '@/features/events/components/events-results';import {queryParameters} from './query';
export function StaticEvents({locale,data,sourcePanel}:{locale:Locale;data:{events:ParisEvent[]};sourcePanel:React.ReactNode}){
const t=useTranslations('Events');const params=useSearchParams();const query=parseEventQuery(queryParameters(params));const events=selectEvents(data.events,query);
${markup}`,
);
await put(
  'src/app/[locale]/events/page.tsx',
  `import {Suspense} from 'react';
import {hasLocale} from 'next-intl';import {notFound} from 'next/navigation';import {routing} from '@/i18n/routing';
import {readStoredData} from '@/features/ingestion/store.server';import {SourcePanel} from '@/features/ingestion/source-panel';
import {StaticEvents} from '@/static/events';
export default async function EventsPage({params}:{params:Promise<{locale:string}>}){
const {locale}=await params;if(!hasLocale(routing.locales,locale))notFound();const data=await readStoredData();
return <Suspense fallback={<p>Mystère Atlas</p>}><StaticEvents locale={locale} data={{events:data.events}} sourcePanel={<SourcePanel scope="events"/>}/></Suspense>;}
`,
);
await put(
  'src/i18n/navigation.ts',
  `import {createNavigation} from 'next-intl/navigation';import {routing} from './routing';
const nav=createNavigation(routing);export const {Link,redirect,usePathname,useRouter}=nav;
export function getPathname(...args:Parameters<typeof nav.getPathname>){return(process.env.NEXT_PUBLIC_BASE_PATH??'')+nav.getPathname(...args);}
`,
);
const panelFile = path.join(target, 'src/features/ingestion/source-panel.tsx');
let panel = await readFile(panelFile, 'utf8');
panel = panel
  .replace("status.state === 'ready'", 'Boolean(status.lastSuccessAt)')
  .replace(
    'status?.state ?? definition.initial',
    "status?.lastSuccessAt ? 'ready' : (status?.state ?? definition.initial)",
  );
await writeFile(panelFile, panel);
const labels = {
  zh: {
    ready: '已收录',
    connected: '{ready} / {total} 个来源已收录',
    date: `资料快照 ${date}`,
  },
  en: {
    ready: 'Recorded',
    connected: '{ready} / {total} sources recorded',
    date: `Data snapshot ${date}`,
  },
  fr: {
    ready: 'Répertorié',
    connected: '{ready} / {total} sources répertoriées',
    date: `Données du ${date}`,
  },
};
for (const [locale, content] of Object.entries(labels)) {
  const file = path.join(target, 'messages', locale + '.json');
  const messages = JSON.parse(await readFile(file, 'utf8'));
  delete messages.Debug;
  messages.Footer.status += ' · ' + content.date;
  await writeFile(file, JSON.stringify(messages, null, 2) + '\n');
  const sourcesFile = path.join(target, 'messages/sources', locale + '.json');
  const sources = JSON.parse(await readFile(sourcesFile, 'utf8'));
  sources.connected = content.connected;
  sources.states.ready = content.ready;
  await writeFile(sourcesFile, JSON.stringify(sources, null, 2) + '\n');
}
const manifest = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8'),
);
manifest.name = 'mystere-atlas-static-demo';
manifest.scripts = {
  dev: 'next dev --hostname 127.0.0.1',
  build: 'node scripts/build.mjs',
  check: 'next typegen && tsc --noEmit',
};
await put('package.json', JSON.stringify(manifest, null, 2) + '\n');
const lock = JSON.parse(
  await readFile(path.join(root, 'package-lock.json'), 'utf8'),
);
lock.name = manifest.name;
lock.packages[''].name = manifest.name;
await put('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
await cp(path.join(root, 'tsconfig.json'), path.join(target, 'tsconfig.json'));
await put(
  'next.config.ts',
  `import createNextIntlPlugin from 'next-intl/plugin';
const basePath=${JSON.stringify(basePath)};
export default createNextIntlPlugin()({output:'export',trailingSlash:true,basePath,turbopack:{root:process.cwd()},images:{unoptimized:true},env:{NEXT_PUBLIC_BASE_PATH:basePath,NEXT_PUBLIC_APP_URL:'https://kada798.github.io'+basePath}});
`,
);
await put(
  'scripts/build.mjs',
  `import {spawnSync} from 'node:child_process';import {writeFile} from 'node:fs/promises';
const build=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit'});if(build.status!==0)process.exit(build.status??1);
const base=${JSON.stringify(basePath)};
await writeFile('out/index.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mystère Atlas</title><body><a href="'+base+'/en/">Enter Mystère Atlas</a><script>const l=navigator.language.startsWith("zh")?"zh":navigator.language.startsWith("fr")?"fr":"en";location.replace('+JSON.stringify(base)+'+"/"+l+"/");</script></body></html>');await writeFile('out/.nojekyll','');
`,
);
await put(
  '.gitignore',
  'node_modules/\n.next/\nout/\nnext-env.d.ts\n*.tsbuildinfo\n.env*\n*.log\n',
);
await put(
  'README.md',
  `# Mystère Atlas\n\nChinese, English and French mystery discovery demo with a searchable works catalog and Paris events map. Built with Next.js static export, React, next-intl, Leaflet and OpenStreetMap.\n\nSearch filters run in the browser; work details are pre-rendered. Accounts, posting and on-site registration are not available. Public data snapshot: ${date}.\n\nOnly the public frontend and attributed public reference data are included. The main development repository remains separate. Use Node.js 24: npm ci, npm run check, npm run build. The ignored out directory is deployed through GitHub Pages. See DATA-SOURCES.md for licenses.\n`,
);
await put(
  'DATA-SOURCES.md',
  `# Public reference data\n\nSnapshot: ${date}. This is a static demonstration; it does not run a live crawler or authenticate users. Records retain source URLs and dates.\n\n- Paris Open Data: https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/ — ODbL. Keyword-discovered candidates are restricted to Paris city postcodes. Confirm sessions and bookings with organizers.\n- Open Library: https://openlibrary.org/dev/docs/api/search — book and actual edition metadata.\n- Wikidata: https://www.wikidata.org/wiki/Wikidata:Data_access — CC0 multilingual metadata and linked site identifiers.\n- IMDb dataset records are excluded from this public snapshot. IMDb links on Wikidata records are external references only. No user reviews or ratings are collected.\n\nDouban and Letterboxd links use Wikidata identifiers; they are not direct imports. Meetup is an external search link, not an automated import.\n\nMaps use Leaflet and OpenStreetMap tiles with visible attribution. No user geolocation is requested.\n`,
);
console.log(
  JSON.stringify({
    target,
    basePath,
    works: snapshot.catalog.works.length,
    events: snapshot.events.length,
    snapshotDate: date,
  }),
);
