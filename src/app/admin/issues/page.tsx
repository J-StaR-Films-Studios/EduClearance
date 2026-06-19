import type { Metadata } from 'next';
import Link from 'next/link';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { isPlatformAdminSession } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`Admin Issues | ${APP_NAME}`, 'Private admin issues page.');

export default async function AdminIssuesPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  return (
    <AdminAppShell activeKey="clearance">
      <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-navy-900">Issue Review Queue</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Issue review is managed from the Global Clearances workspace. Use that page to inspect unresolved issue reports alongside paid clearance checks and wallet operations.
        </p>
        <Link href="/admin/clearance" className="mt-4 inline-block rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800">
          Open Global Clearances
        </Link>
      </div>
    </AdminAppShell>
  );
}
