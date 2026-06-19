import type { MetadataRoute } from 'next';

import { getAppUrl } from '@/lib/site';

const disallowRoutes = [
  '/login',
  '/register',
  '/claim-school',
  '/auth',
  '/auth/',
  '/dashboard',
  '/clearance',
  '/clearance/',
  '/issues',
  '/issues/',
  '/wallet',
  '/admin',
  '/admin/',
  '/api/',
];

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowRoutes,
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
