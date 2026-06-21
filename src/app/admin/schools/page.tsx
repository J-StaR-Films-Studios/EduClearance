import type { Metadata } from 'next';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminSchoolsWorkspace } from '@/components/admin/admin-schools-workspace';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { db } from '@/db/client';
import { schools } from '@/db/schema';
import { isPlatformAdminSession } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`School Approvals | ${APP_NAME}`, 'Private admin school approvals page.');

export default async function AdminSchoolsPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  const schoolRows = await db.select().from(schools);
  const claimSchools = schoolRows.map((school) => ({
    id: school.id,
    name: school.name,
    lga: school.area ?? school.address ?? 'Area not specified',
    claimantName: school.contactPerson ?? 'School contact',
    claimantEmail: school.contactEmail ?? 'No email recorded',
    phone: school.clearancePhone ?? school.mainPhone ?? 'No phone recorded',
    documentName: 'Directory profile',
    status: school.status === 'active' ? 'active' as const : school.status === 'suspended' ? 'suspended' as const : 'pending' as const,
    claimType: 'existing_directory_profile' as const,
    submittedAt: school.createdAt.toISOString().slice(0, 10),
    officialContact: school.clearancePhone ?? school.mainPhone ?? '',
    contactEmail: school.contactEmail ?? '',
    contactPerson: school.contactPerson ?? '',
    adminNote: `Directory status: ${school.status}`,
  }));

  return (
    <AdminAppShell activeKey="schools">
      <header className="border-b border-background-secondary pb-4">
        <h1 className="text-2xl font-bold text-navy-900">School Approvals Hub</h1>
        <p className="text-xs text-slate-500">Approve claims and inspect government registration credentials</p>
      </header>

      <AdminSchoolsWorkspace initialSchools={claimSchools} />
    </AdminAppShell>
  );
}
