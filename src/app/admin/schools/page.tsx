import type { Metadata } from 'next';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminSchoolsWorkspace } from '@/components/admin/admin-schools-workspace';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { isPlatformAdminSession } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`School Approvals | ${APP_NAME}`, 'Private admin school approvals page.');

export default async function AdminSchoolsPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  return (
    <AdminAppShell activeKey="schools">
      <header className="border-b border-background-secondary pb-4">
        <h1 className="text-2xl font-bold text-navy-900">School Approvals Hub</h1>
        <p className="text-xs text-slate-500">Approve claims and inspect government registration credentials</p>
      </header>

      <AdminSchoolsWorkspace />
    </AdminAppShell>
  );
}
