import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertReleaseTree, validateVersion } from './release-utils.mjs';

const version = validateVersion(process.env.RELEASE_VERSION);
if (process.argv.includes('--validate-version')) {
  console.log(`Release version: ${version}`);
} else {
  if (process.platform !== 'linux' || process.arch !== 'x64')
    throw new Error(
      'Build release bundles with the Linux x64 GitHub Release workflow.',
    );
  const root = fileURLToPath(new URL('../', import.meta.url));
  const standalone = path.join(root, '.next', 'standalone');
  await readFile(path.join(standalone, 'server.js'));
  // Refuse to copy a traced environment file or local snapshot into an artifact.
  await assertReleaseTree(standalone);
  const destination = path.join(root, 'tmp', 'release');
  const runtime = path.join(destination, 'runtime');
  await mkdir(destination, { recursive: true });
  await mkdir(runtime); // A fresh build only; never mix two release trees.
  await cp(standalone, runtime, { recursive: true, verbatimSymlinks: true });
  await cp(
    path.join(root, '.next', 'static'),
    path.join(runtime, '.next', 'static'),
    { recursive: true },
  );
  try {
    await cp(path.join(root, 'public'), path.join(runtime, 'public'), {
      recursive: true,
    });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  if (
    !/^[0-9a-f]{40}$/.test(commit) ||
    (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== commit)
  )
    throw new Error('The release source does not match the workflow commit');
  const manifest = {
    application: 'mystere-atlas',
    version,
    commit,
    builtAt: new Date().toISOString(),
    platform: 'linux',
    arch: 'x64',
    nodeMajor: 24,
    dataIncluded: false,
    demoUrl: 'https://mystere-atlas.yellowelm32.chatgpt.site',
    deploysDemo: false,
  };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(path.join(runtime, 'release-manifest.json'), manifestText);
  await writeFile(
    path.join(destination, 'release-manifest.json'),
    manifestText,
  );
  await writeFile(
    path.join(runtime, 'README-RUN.md'),
    `# Mystère Atlas ${version}\n\nLinux x64, Node.js 24. From this directory run:\n\nHOSTNAME=127.0.0.1 PORT=3000 node server.js\n\nThen open http://127.0.0.1:3000/en. Environment secrets and local .data snapshots are excluded. Mount your own persistent .data/snapshot.json if needed; without it the catalog correctly starts empty. Place a reverse proxy in front of the Node server for public hosting. This package does not update the separate Sites demo.\n`,
  );
  await writeFile(
    path.join(destination, 'RELEASE-NOTES.md'),
    `Validated Next.js application bundle for Linux x64 / Node.js 24.\n\nSource commit: ${commit}\n\nChecks: lint, types, formatting, domain tests, production build, and packaged-runtime smoke tests.\n\nIncludes a SHA-256 checksum and release manifest. Environment secrets, local data, and logs are excluded. The current public demo is hosted separately at ${manifest.demoUrl}; this release does not deploy it.\n`,
  );
  await assertReleaseTree(runtime);
  const name = `mystere-atlas-v${version}-linux-x64.tar.gz`;
  execFileSync(
    'tar',
    ['-czf', path.join(destination, name), '-C', runtime, '.'],
    { stdio: 'inherit' },
  );
  const digest = createHash('sha256')
    .update(await readFile(path.join(destination, name)))
    .digest('hex');
  const manifestDigest = createHash('sha256')
    .update(manifestText)
    .digest('hex');
  await writeFile(
    path.join(destination, 'SHA256SUMS'),
    `${digest}  ${name}\n${manifestDigest}  release-manifest.json\n`,
  );
  console.log(
    JSON.stringify({
      version,
      commit,
      archive: path.join(destination, name),
      runtime,
    }),
  );
}
