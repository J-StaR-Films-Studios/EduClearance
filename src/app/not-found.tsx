import Link from 'next/link';

import { APP_NAME } from '@/lib/site';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-4 rounded-2xl border border-background-secondary bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">{APP_NAME}</p>
        <h1 className="text-3xl font-bold text-navy-900">Page not found</h1>
        <p className="text-sm text-slate-600">The requested page is not available in this build foundation yet.</p>
        <Link href="/" className="inline-flex rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
          Back to home
        </Link>
      </div>
    </main>
  );
}
