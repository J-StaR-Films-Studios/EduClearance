import type { MetadataRoute } from 'next';

import { PUBLIC_SITE_ROUTES, getAppUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl();
  const lastModified = new Date();

  return PUBLIC_SITE_ROUTES.map((route) => ({
    url: route === '/' ? appUrl : `${appUrl}${route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
