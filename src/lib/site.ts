export const APP_NAME = 'EduClearance';
export const APP_TAGLINE = 'Student transfer clearance network for Nigerian schools';
export const APP_DESCRIPTION =
  'EduClearance helps Nigerian schools run private transfer clearance checks, report unresolved issues, and manage wallet credits through a secure school-to-school workflow.';
export const APP_KEYWORDS = [
  'student transfer clearance',
  'school clearance verification',
  'school-to-school verification',
  'school admissions clearance',
  'outstanding school fees checks',
  'Nigerian schools',
  'private school transfer workflow',
] as const;
export const OG_IMAGE_PATH = '/opengraph-image';
export const PUBLIC_SITE_ROUTES = ['/'] as const;
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@educlearance.meloschool.com';

const DEFAULT_APP_URL = 'http://localhost:3000';

function normalizeAppUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getAppUrl() {
  const candidate = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;

  try {
    return normalizeAppUrl(new URL(candidate).toString());
  } catch {
    return DEFAULT_APP_URL;
  }
}

export function getMetadataBase() {
  return new URL(getAppUrl());
}
