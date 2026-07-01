import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminDisputesWorkspace } from '@/components/admin/admin-disputes-workspace';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { db } from '@/db/client';
import { clearanceIssues, disputes, schools } from '@/db/schema';
import { isPlatformAdminSession } from '@/lib/local-session';
import { formatNairaFromKobo } from '@/lib/money';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`Platform Disputes | ${APP_NAME}`, 'Private admin disputes page.');

export default async function AdminDisputesPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  const disputeRows = await db.select().from(disputes).limit(100);
  const disputeRecords = await Promise.all(
    disputeRows.map(async (dispute) => {
      const [[issue], [raisedBySchool]] = await Promise.all([
        dispute.clearanceIssueId ? db.select().from(clearanceIssues).where(eq(clearanceIssues.id, dispute.clearanceIssueId)).limit(1) : Promise.resolve([]),
        dispute.raisedBySchoolId ? db.select().from(schools).where(eq(schools.id, dispute.raisedBySchoolId)).limit(1) : Promise.resolve([]),
      ]);
      const [reportingSchool] = issue ? await db.select().from(schools).where(eq(schools.id, issue.reportingSchoolId)).limit(1) : [null];

      return {
        id: dispute.id,
        studentName: issue?.studentName ?? 'Unknown student',
        amountLabel: issue ? formatNairaFromKobo(issue.amountOwed) : 'Amount unavailable',
        raisedBySchool: raisedBySchool?.name ?? 'Admitting school',
        reportingSchool: reportingSchool?.name ?? 'Reporting school',
        status: dispute.status === 'resolved' ? 'resolved' as const : dispute.status === 'rejected' ? 'rejected' as const : 'under_review' as const,
        raisedAt: dispute.createdAt.toISOString().slice(0, 16).replace('T', ' '),
        reason: dispute.reason,
        adminNote: dispute.adminNote ?? 'Evidence review pending.',
        refundReady: dispute.status === 'under_review',
        clearanceRequestId: dispute.clearanceRequestId,
        clearanceIssueId: dispute.clearanceIssueId,
      };
    }),
  );

  return (
    <AdminAppShell activeKey="disputes">
      <header className="flex flex-col gap-1 border-b border-background-secondary pb-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900">Dispute Resolution Workspace</h1>
          <p className="text-xs text-slate-500">Resolve inter-school record contests and billing disputes</p>
        </div>
      </header>

      <AdminDisputesWorkspace initialRecords={disputeRecords} />
    </AdminAppShell>
  );
}
