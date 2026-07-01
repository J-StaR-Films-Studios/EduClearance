import type { Metadata } from 'next';
import Link from 'next/link';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { isPlatformAdminSession } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`Admin Wallets | ${APP_NAME}`, 'Private admin wallets page.');

export default async function AdminWalletsPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  return (
    <AdminAppShell activeKey="clearance">
      <div className="max-w-2xl mx-auto my-4 sm:my-8 rounded-2xl border border-background-secondary bg-white p-5 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900">Wallet Operations</h1>
        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-500">
          Wallet controls are managed from the Global Clearances workspace. Use that page for manual credit or debit operations, low-balance watchlists, and refund helper reminders.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Link href="/admin/clearance" className="inline-flex items-center justify-center rounded-lg bg-navy-900 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-navy-800 w-full sm:w-auto text-center">
            Open Wallet Controls
          </Link>
        </div>
      </div>
    </AdminAppShell>
  );
}
