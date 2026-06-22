import type { Metadata } from 'next';
import Link from 'next/link';
import { count, desc, eq } from 'drizzle-orm';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { db } from '@/db/client';
import { clearanceIssues, clearanceRequests, disputes, schoolClaims, schools } from '@/db/schema';
import { APP_NAME } from '@/lib/site';
import { isPlatformAdminSession } from '@/lib/local-session';
import { formatNairaFromKobo } from '@/lib/money';
import { noIndexMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = noIndexMetadata(`Admin Overview | ${APP_NAME}`, 'Private EduClearance platform admin overview.');

export default async function AdminOverviewPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  const [[activeSchools], [pendingClaims], [reviewDisputes], [totalChecks], recentIssues, recentPendingClaims] = await Promise.all([
    db.select({ value: count() }).from(schools).where(eq(schools.status, 'active')),
    db.select({ value: count() }).from(schoolClaims).where(eq(schoolClaims.status, 'pending')),
    db.select({ value: count() }).from(disputes).where(eq(disputes.status, 'under_review')),
    db.select({ value: count() }).from(clearanceRequests),
    db.select().from(clearanceIssues).orderBy(desc(clearanceIssues.createdAt)).limit(3),
    db.select().from(schoolClaims).where(eq(schoolClaims.status, 'pending')).orderBy(desc(schoolClaims.createdAt)).limit(3),
  ]);

  const metrics = [
    { label: 'Total Active Schools', value: String(activeSchools?.value ?? 0) },
    { label: 'Pending claims', value: String(pendingClaims?.value ?? 0), tone: 'warning' as const },
    { label: 'Disputes Under Review', value: String(reviewDisputes?.value ?? 0), tone: 'danger' as const },
    { label: 'Total Checks Run', value: String(totalChecks?.value ?? 0) },
  ];

  const recentIssueCards = await Promise.all(
    recentIssues.map(async (issue) => {
      const [reportingSchool] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, issue.reportingSchoolId)).limit(1);

      return {
        id: issue.id,
        studentName: issue.studentName,
        reportingSchool: reportingSchool?.name ?? 'Reporting school',
        amountLabel: formatNairaFromKobo(issue.amountOwed),
        updatedAt: issue.createdAt.toISOString().slice(0, 10),
      };
    }),
  );

  return (
    <AdminAppShell activeKey="overview">
      <header className="border-b border-background-secondary pb-4">
        <h1 className="text-2xl font-bold text-navy-900">Platform Operations Center</h1>
        <p className="text-xs text-slate-500">Monitor local clusters, verify claims, and inspect disputes</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-slate-500">{metric.label}</p>
            <p
              className={cn(
                'mt-1 text-xl font-bold',
                metric.tone === 'warning'
                  ? 'text-amber-600'
                  : metric.tone === 'danger'
                    ? 'text-terracotta-600'
                    : 'text-navy-900',
              )}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-navy-900">Operational Alerts</h3>
          <div className="rounded-xl border border-background-secondary bg-background p-4 text-xs leading-relaxed text-slate-500">
            Automated anomaly alerts are not enabled yet. Review clearance logs, disputes, and wallet activity from the operational workspaces.
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-navy-900">Recent Pending Claims</h3>
          <div className="space-y-3">
            {recentPendingClaims.length === 0 ? (
              <p className="rounded-lg border border-background-secondary bg-background p-3 text-xs text-slate-500">No school claims are pending review.</p>
            ) : recentPendingClaims.map((claim) => (
              <div key={claim.id} className="space-y-2 rounded-lg border border-background-secondary bg-background p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-navy-900">{claim.requestedSchoolName}</span>
                  <span className="font-mono text-slate-500">{claim.createdAt.toISOString().slice(0, 10)}</span>
                </div>
                <p className="text-slate-600">
                  {claim.type === 'new_school' ? 'New school request' : 'Directory school claim'} · {claim.applicantName}
                </p>
                <p className="text-slate-500">Proof file: {claim.proofFileName}</p>
                <Link href="/admin/schools" className="inline-block font-bold text-navy-900 hover:underline">
                  Review Claim →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-background-secondary pb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Issue &amp; Clearance Snapshot</h3>
              <p className="text-xs text-slate-500">Operational overview across unresolved reports and paid checks</p>
            </div>
            <Link href="/admin/clearance" className="text-xs font-semibold text-navy-900 hover:underline">
              Open workspace
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recentIssueCards.length === 0 ? (
              <p className="rounded-xl border border-background-secondary bg-background p-4 text-xs text-slate-500 sm:col-span-3">No issue reports have been saved yet.</p>
            ) : recentIssueCards.map((issue) => (
              <div key={issue.id} className="rounded-xl border border-background-secondary bg-background p-4 text-xs">
                <p className="font-semibold text-navy-900">{issue.studentName}</p>
                <p className="mt-1 text-slate-500">{issue.reportingSchool}</p>
                <p className="mt-2 font-bold text-navy-900">{issue.amountLabel}</p>
                <p className="mt-1 text-slate-400">{issue.updatedAt}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-navy-900">Admin Quick Routes</h3>
          <div className="space-y-2 text-xs">
            <Link href="/admin/schools" className="block rounded-lg border border-background-secondary bg-background px-3 py-2 font-semibold text-navy-900 hover:bg-background-secondary">
              School approvals & contact edits
            </Link>
            <Link href="/admin/clearance" className="block rounded-lg border border-background-secondary bg-background px-3 py-2 font-semibold text-navy-900 hover:bg-background-secondary">
              Clearance monitoring & wallet controls
            </Link>
            <Link href="/admin/disputes" className="block rounded-lg border border-background-secondary bg-background px-3 py-2 font-semibold text-navy-900 hover:bg-background-secondary">
              Dispute resolution & refund helper
            </Link>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
