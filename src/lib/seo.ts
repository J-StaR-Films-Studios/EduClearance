import type { Metadata } from 'next';

export const noIndexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

export const privateRouteMatchers = [
  '/login',
  '/register',
  '/claim-school',
  '/dashboard',
  '/clearance',
  '/clearance/:path*',
  '/issues',
  '/issues/:path*',
  '/wallet',
  '/admin',
  '/admin/:path*',
];

export function noIndexMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}
