import type { NextConfig } from 'next';

import { noIndexHeaders, privateRouteMatchers } from './src/lib/seo';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return privateRouteMatchers.map((source) => ({
      source,
      headers: noIndexHeaders,
    }));
  },
};

export default nextConfig;
