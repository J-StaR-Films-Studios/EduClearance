import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Outfit } from 'next/font/google';

import {
  APP_DESCRIPTION,
  APP_KEYWORDS,
  APP_NAME,
  OG_IMAGE_PATH,
  getAppUrl,
  getMetadataBase,
} from '@/lib/site';
import { cn } from '@/lib/utils';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [...APP_KEYWORDS],
  applicationName: APP_NAME,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: appUrl,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} social preview`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, outfit.variable, 'min-h-screen bg-background text-navy-800 antialiased')}>
        {children}
      </body>
    </html>
  );
}
