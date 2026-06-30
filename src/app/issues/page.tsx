import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { db } from '@/db/client';
import { clearanceIssues } from '@/db/schema';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { formatNairaFromKobo } from '@/lib/money';
import { requireSchoolSession } from '@/lib/require-school-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = noIndexMetadata(`Reported Issues | ${APP_NAME}`, 'Private reported issues list.');

function getIssueCategoryLabel(issueType: string) {
  const labels: Record<string, string> = {
    school_fees: 'Outstanding School Fees',
    books: 'Books / Learning Materials',
    uniform: 'Uniform / Materials',
    transport: 'Transport',
    other: 'Other Obligation',
  };

  return labels[issueType] ?? 'Other Obligation';
}

function getIssueStatusLabel(status: string) {
  const labels: Record<string, string> = {
    unresolved: 'Unresolved',
    disputed: 'Under review',
    resolved: 'Resolved',
    withdrawn: 'Withdrawn',
  };

  return labels[status] ?? status;
}

export default async function IssuesPage() {
  const currentRole = await requireSchoolSession('/issues');
  const actor = await resolveLocalSchoolActor();
  const issues = actor
    ? await db
        .select()
        .from(clearanceIssues)
        .where(eq(clearanceIssues.reportingSchoolId, actor.schoolId))
        .orderBy(desc(clearanceIssues.createdAt))
        .limit(100)
    : [];
  const unresolvedCount = issues.filter((issue) => issue.status === 'unresolved').length;
  const reviewCount = issues.filter((issue) => issue.status === 'disputed').length;
  const resolvedCount = issues.filter((issue) => issue.status === 'resolved').length;

  return (
    <SchoolAppShell activeKey="issues-new" mobileMode="history" role={currentRole}>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-background-secondary pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Reported Issues</h1>
            <p className="text-xs text-slate-500">Review unresolved issue records your school has contributed to the transfer-clearance network.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/issues/new" className="rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800">
              Report New Issue
            </Link>
            <Link href="/dashboard" className="text-xs text-slate-500 hover:text-navy-900">
              ← Back
            </Link>
          </div>
        </header>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          Issue resolution, withdrawal, and evidence review are handled through school-scoped review controls with audit logging.
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unresolved</p>
            <p className="mt-1 text-2xl font-bold text-terracotta-600">{unresolvedCount}</p>
            <p className="text-xs text-slate-500">Need follow-up or settlement confirmation</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Under review</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{reviewCount}</p>
            <p className="text-xs text-slate-500">Pending evidence review or dispute handling</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{resolvedCount}</p>
            <p className="text-xs text-slate-500">Retained for audit context</p>
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-background-secondary bg-white shadow-sm">
          <div className="border-b border-background-secondary p-6">
            <h2 className="text-sm font-bold text-navy-900">Issue Register</h2>
          </div>
          <div className="overflow-x-auto whitespace-nowrap">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Session</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-secondary text-slate-600">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No issue reports have been saved yet.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="px-6 py-4 align-top">
                        <Link href={`/issues/${issue.id}`} className="font-semibold text-navy-900 hover:underline">{issue.studentName}</Link>
                        <p className="mt-1 text-[11px] text-slate-500">Parent: {issue.parentName}</p>
                        <p className="mt-1 text-[11px] text-slate-400">Reported {issue.createdAt.toISOString().slice(0, 10)}</p>
                        <Link href={`/issues/${issue.id}`} className="mt-2 inline-flex text-[11px] font-semibold text-navy-900 underline">View case history</Link>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="font-medium text-navy-900">{getIssueCategoryLabel(issue.issueType)}</p>
                        <p className="mt-1 whitespace-normal text-[11px] leading-relaxed text-slate-500">{issue.note}</p>
                      </td>
                      <td className="px-6 py-4 align-top">{issue.academicSession} · {issue.term}</td>
                      <td className="px-6 py-4 align-top font-semibold text-navy-900">{formatNairaFromKobo(issue.amountOwed)}</td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 font-semibold',
                            issue.status === 'resolved'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : issue.status === 'disputed'
                                ? 'border-amber-100 bg-amber-50 text-amber-700'
                                : 'border-terracotta-100 bg-terracotta-50 text-terracotta-700',
                          )}
                        >
                          {getIssueStatusLabel(issue.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">{actor?.schoolName ?? 'Your school'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SchoolAppShell>
  );
}
