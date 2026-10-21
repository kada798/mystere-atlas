import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.RELEASE_STANDALONE === '1' ? 'standalone' : undefined,
  outputFileTracingExcludes: {
    '/*': [
      './.env*',
      './tmp/**',
      './.vercel/**',
      ...(process.env.DEPLOY_DATA_SNAPSHOT === '1' ? [] : ['./.data/**']),
    ],
  },
  outputFileTracingIncludes:
    process.env.DEPLOY_DATA_SNAPSHOT === '1'
      ? { '/*': ['./.data/snapshot.json'] }
      : undefined,
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
