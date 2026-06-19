import type { Metadata } from 'next';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminDisputesWorkspace } from '@/components/admin/admin-disputes-workspace';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { isPlatformAdminSession } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`Platform Disputes | ${APP_NAME}`, 'Private admin disputes page.');

export default async function AdminDisputesPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  return (
    <AdminAppShell activeKey="disputes">
      <header className="border-b border-background-secondary pb-4">
        <h1 className="text-2xl font-bold text-navy-900">Dispute Resolution Workspace</h1>
        <p className="text-xs text-slate-500">Resolve inter-school record contests and billing disputes</p>
      </header>

      <AdminDisputesWorkspace />
    </AdminAppShell>
  );
}
