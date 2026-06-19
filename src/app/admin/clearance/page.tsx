import type { Metadata } from 'next';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminClearanceWorkspace } from '@/components/admin/admin-clearance-workspace';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { isPlatformAdminSession } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`Global Clearances | ${APP_NAME}`, 'Private admin clearance and wallet controls page.');

export default async function AdminClearancePage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  return (
    <AdminAppShell activeKey="clearance">
      <header className="border-b border-background-secondary pb-4">
        <h1 className="text-2xl font-bold text-navy-900">Platform Clearances &amp; Wallet Controls</h1>
        <p className="text-xs text-slate-500">Track clearance requests and adjust school wallet balances</p>
      </header>

      <AdminClearanceWorkspace />
    </AdminAppShell>
  );
}
