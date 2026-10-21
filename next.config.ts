import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.RELEASE_STANDALONE === '1' ? 'standalone' : undefined,
  outputFileTracingExcludes: {
    '/*': ['./.env*', './.data/**', './tmp/**'],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
