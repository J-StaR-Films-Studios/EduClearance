import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq, ilike, or } from 'drizzle-orm';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { db } from '@/db/client';
import { clearanceIssues, clearanceRequests, schools } from '@/db/schema';
import { isPlatformAdminSession } from '@/lib/local-session';
import { formatNairaFromKobo } from '@/lib/money';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = noIndexMetadata(`Admin Issues | ${APP_NAME}`, 'Private admin issues page.');

type AdminIssuesPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    unresolved: 'Unresolved',
    disputed: 'Under review',
    resolved: 'Resolved',
    withdrawn: 'Withdrawn',
  };

  return labels[status] ?? status;
}

export default async function AdminIssuesPage({ searchParams }: AdminIssuesPageProps) {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const issueRows = await db
    .select()
    .from(clearanceIssues)
    .where(query ? or(ilike(clearanceIssues.studentName, `%${query}%`), ilike(clearanceIssues.parentName, `%${query}%`), ilike(clearanceIssues.parentPhone, `%${query}%`)) : undefined)
    .orderBy(desc(clearanceIssues.createdAt))
    .limit(100);

  const issues = await Promise.all(issueRows.map(async (issue) => {
    const [[reportingSchool], [request]] = await Promise.all([
      db.select({ name: schools.name }).from(schools).where(eq(schools.id, issue.reportingSchoolId)).limit(1),
      issue.clearanceRequestId ? db.select().from(clearanceRequests).where(eq(clearanceRequests.id, issue.clearanceRequestId)).limit(1) : Promise.resolve([]),
    ]);

    return { issue, reportingSchoolName: reportingSchool?.name ?? 'Reporting school', clearanceRequestId: request?.id ?? issue.clearanceRequestId };
  }));

  return (
    <AdminAppShell activeKey="clearance">
      <div className="space-y-6">
        <header className="flex flex-col gap-2 border-b border-background-secondary pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900">Issue Review Queue</h1>
            <p className="text-xs text-slate-500">Search issue records, evidence, and linked clearance cases.</p>
          </div>
          <Link href="/admin/clearance" className="text-xs font-semibold text-navy-900 hover:underline shrink-0 sm:mt-0 mt-1">
            Open Global Clearances
          </Link>
        </header>

        <form className="flex flex-col gap-2 rounded-2xl border border-background-secondary bg-white p-4 shadow-sm sm:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search student, parent, or phone"
            className="min-w-0 flex-1 rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <button className="rounded-lg bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800 shrink-0" type="submit">
            Search
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-background-secondary bg-white shadow-sm">
          <div className="border-b border-background-secondary p-5 sm:p-6">
            <h2 className="text-sm font-bold text-navy-900">Issue records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 sm:px-6 py-3 min-w-[150px]">Student</th>
                  <th className="px-4 sm:px-6 py-3 min-w-[150px]">Reporting School</th>
                  <th className="px-4 sm:px-6 py-3 min-w-[100px]">Amount</th>
                  <th className="px-4 sm:px-6 py-3 min-w-[100px]">Status</th>
                  <th className="px-4 sm:px-6 py-3 min-w-[130px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-secondary text-slate-600">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-sm text-slate-500">
                      No issue records match this search.
                    </td>
                  </tr>
                ) : (
                  issues.map(({ issue, reportingSchoolName, clearanceRequestId }) => (
                    <tr key={issue.id} className="hover:bg-background/40 transition-colors">
                      <td className="px-4 sm:px-6 py-4 align-top whitespace-normal break-words">
                        <Link href={`/issues/${issue.id}`} className="font-semibold text-navy-900 hover:underline">
                          {issue.studentName}
                        </Link>
                        <p className="mt-1 text-[11px] text-slate-500">Parent: {issue.parentName}</p>
                        <p className="mt-1 text-[10px] text-slate-400">Reported {issue.createdAt.toISOString().slice(0, 10)}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 align-top whitespace-normal break-words">
                        {reportingSchoolName}
                      </td>
                      <td className="px-4 sm:px-6 py-4 align-top font-semibold text-navy-900 shrink-0">
                        {formatNairaFromKobo(issue.amountOwed)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 align-top">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                            issue.status === 'resolved'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : issue.status === 'disputed'
                                ? 'border-amber-100 bg-amber-50 text-amber-700'
                                : 'border-terracotta-100 bg-terracotta-50 text-terracotta-700',
                          )}
                        >
                          {statusLabel(issue.status)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 align-top whitespace-normal break-words">
                        <div className="flex flex-col gap-1.5">
                          <Link href={`/issues/${issue.id}`} className="font-semibold text-navy-900 hover:underline">
                            View issue
                          </Link>
                          {clearanceRequestId ? (
                            <Link href={`/clearance/${clearanceRequestId}`} className="font-semibold text-navy-900 hover:underline text-slate-500">
                              View clearance case
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
