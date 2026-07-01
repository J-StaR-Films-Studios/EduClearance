import type { Metadata } from 'next';

import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE, getAppUrl } from './site';

export const noIndexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

export const privateRouteMatchers = [
  '/login',
  '/register',
  '/claim-school',
  '/auth/:path*',
  '/account',
  '/account/:path*',
  '/api/:path*',
  '/dashboard',
  '/clearance',
  '/clearance/:path*',
  '/issues',
  '/issues/:path*',
  '/wallet',
  '/admin',
  '/admin/:path*',
];

function sanitizeTitle(title: string) {
  const suffix = ` | ${APP_NAME}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

export function noIndexMetadata(title: string, description?: string): Metadata {
  return {
    title: sanitizeTitle(title),
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export function buildHomepageStructuredData() {
  const appUrl = getAppUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: APP_NAME,
    slogan: APP_TAGLINE,
    url: appUrl,
    description: APP_DESCRIPTION,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Schools',
    },
    provider: {
      '@type': 'Organization',
      name: APP_NAME,
      url: appUrl,
    },
    offers: {
      '@type': 'Offer',
      price: '5000',
      priceCurrency: 'NGN',
      description: '50 student transfer clearance checks',
    },
  };
}
