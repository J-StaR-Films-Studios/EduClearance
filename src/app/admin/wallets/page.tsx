import type { Metadata } from 'next';
import Link from 'next/link';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { isPlatformAdminSession } from '@/lib/demo-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`Admin Wallets | ${APP_NAME}`, 'Private admin wallets placeholder page.');

export default async function AdminWalletsPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  return (
    <AdminAppShell activeKey="clearance">
      <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-navy-900">Wallet Operations</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          The locked mockups place wallet controls beside clearance monitoring. Use the Global Clearances workspace for manual credit or debit operations, low-balance watchlists, and refund helper reminders.
        </p>
        <Link href="/admin/clearance" className="mt-4 inline-block rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800">
          Open Wallet Controls
        </Link>
      </div>
    </AdminAppShell>
  );
}
