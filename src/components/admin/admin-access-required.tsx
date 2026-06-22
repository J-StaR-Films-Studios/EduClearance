import Link from 'next/link';

import { buildLocalAccessHref } from '@/lib/local-session';

export function AdminAccessRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-background-secondary bg-white p-8 text-center shadow-sm">
        <div className="mx-auto inline-flex rounded-xl bg-navy-900 px-3 py-1.5 font-display text-lg font-bold tracking-wider text-white">
          EC
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-navy-900">Platform Admin Access Required</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            This workspace is private and reserved for platform administrators only. Sign in to review school claims,
            clearance activity, wallet operations, and disputes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={buildLocalAccessHref('platform_admin', '/admin')}
            className="flex-1 rounded-lg bg-navy-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-navy-800"
          >
            Sign In as Platform Admin
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-lg border border-background-secondary bg-white px-4 py-3 text-sm font-medium text-navy-900 transition hover:bg-background-secondary"
          >
            School Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
