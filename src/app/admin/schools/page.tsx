import type { Metadata } from 'next';

import { desc, eq } from 'drizzle-orm';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminSchoolsWorkspace } from '@/components/admin/admin-schools-workspace';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { db } from '@/db/client';
import { schoolClaims, schools } from '@/db/schema';
import { isPlatformAdminSession } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`School Claims | ${APP_NAME}`, 'Private admin school claims review page.');

export default async function AdminSchoolsPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  const claimRows = await db
    .select({
      id: schoolClaims.id,
      schoolId: schoolClaims.schoolId,
      requestedSchoolName: schoolClaims.requestedSchoolName,
      requestedArea: schoolClaims.requestedArea,
      requestedAddress: schoolClaims.requestedAddress,
      applicantName: schoolClaims.applicantName,
      applicantEmail: schoolClaims.applicantEmail,
      officialContactName: schoolClaims.officialContactName,
      officialEmail: schoolClaims.officialEmail,
      officialPhone: schoolClaims.officialPhone,
      proofFileName: schoolClaims.proofFileName,
      proofFileType: schoolClaims.proofFileType,
      proofFileSize: schoolClaims.proofFileSize,
      hasProofFile: schoolClaims.proofFileDataUrl,
      proofNote: schoolClaims.proofNote,
      type: schoolClaims.type,
      status: schoolClaims.status,
      adminNote: schoolClaims.adminNote,
      createdAt: schoolClaims.createdAt,
      reviewedAt: schoolClaims.reviewedAt,
      linkedSchoolName: schools.name,
      linkedSchoolStatus: schools.status,
    })
    .from(schoolClaims)
    .leftJoin(schools, eq(schoolClaims.schoolId, schools.id))
    .orderBy(desc(schoolClaims.createdAt))
    .limit(100);

  const submittedClaims = claimRows.map((claim) => ({
    ...claim,
    hasProofFile: Boolean(claim.hasProofFile),
    createdAt: claim.createdAt.toISOString(),
    reviewedAt: claim.reviewedAt?.toISOString() ?? null,
    linkedSchoolStatus: claim.linkedSchoolStatus ?? null,
    linkedSchoolName: claim.linkedSchoolName ?? null,
  }));

  return (
    <AdminAppShell activeKey="schools">
      <header className="border-b border-background-secondary pb-4">
        <h1 className="text-2xl font-bold text-navy-900">Submitted School Claims</h1>
        <p className="text-xs text-slate-500">Review submitted claims and new-school requests. Directory candidates stay in the public claim flow.</p>
      </header>

      <AdminSchoolsWorkspace initialClaims={submittedClaims} />
    </AdminAppShell>
  );
}
