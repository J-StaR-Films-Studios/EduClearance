import type { MetadataRoute } from 'next';

import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE, getAppUrl } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  const appUrl = getAppUrl();

  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    categories: ['business', 'education', 'productivity'],
    icons: [
      {
        src: `${appUrl}/icon.svg`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: 'Start a clearance request',
        short_name: 'Clearance',
        description: APP_TAGLINE,
        url: '/clearance/new',
      },
    ],
  };
}
