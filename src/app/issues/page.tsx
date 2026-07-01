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
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="flex flex-col gap-4 border-b border-background-secondary pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-navy-900">Reported Issues</h1>
            <p className="text-xs text-slate-500 max-w-xl">Review unresolved issue records your school has contributed to the transfer-clearance network.</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <Link href="/issues/new" className="rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800 text-center whitespace-nowrap">
              Report New Issue
            </Link>
            <Link href="/dashboard" className="text-xs font-medium text-slate-500 hover:text-navy-900 whitespace-nowrap">
              ← Back
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-background-secondary bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unresolved</p>
            <p className="mt-1 text-2xl font-bold text-terracotta-600">{unresolvedCount}</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Need follow-up or settlement confirmation</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Under review</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{reviewCount}</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Pending evidence review or dispute handling</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{resolvedCount}</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Retained for audit context</p>
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-background-secondary bg-white shadow-sm">
          <div className="border-b border-background-secondary p-4 sm:p-6">
            <h2 className="text-sm font-bold text-navy-900">Issue Register</h2>
          </div>
          {issues.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No issue reports have been saved yet.
            </div>
          ) : (
            <>
              {/* Mobile Card List (hidden on md and larger) */}
              <div className="block md:hidden divide-y divide-background-secondary">
                {issues.map((issue) => (
                  <details key={issue.id} className="group border-b border-background-secondary last:border-b-0">
                    <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none hover:bg-slate-50/50">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm text-navy-900 block truncate">
                          {issue.studentName}
                        </span>
                        <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {getIssueCategoryLabel(issue.issueType)} · Parent: {issue.parentName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-navy-900 font-bold text-xs block">{formatNairaFromKobo(issue.amountOwed)}</span>
                          <span
                            className={cn(
                              'inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-1',
                              issue.status === 'resolved'
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                : issue.status === 'disputed'
                                  ? 'border-amber-100 bg-amber-50 text-amber-700'
                                  : 'border-terracotta-100 bg-terracotta-50 text-terracotta-700',
                            )}
                          >
                            {getIssueStatusLabel(issue.status)}
                          </span>
                        </div>
                        <svg
                          className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </summary>

                    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100/50 bg-slate-50/20">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-white rounded-xl p-3 border border-background-secondary text-[11px] text-slate-600 shadow-sm">
                        <div>
                          <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[8px]">Category</span>
                          <span className="text-slate-800 font-medium block truncate">{getIssueCategoryLabel(issue.issueType)}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[8px]">Session / Term</span>
                          <span className="text-slate-800 block truncate">{issue.academicSession} · {issue.term}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[8px]">Reported Date</span>
                          <span className="text-slate-800 block">{issue.createdAt.toISOString().slice(0, 10)}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[8px]">Source</span>
                          <span className="text-slate-800 block truncate" title={actor?.schoolName ?? 'Your school'}>
                            {actor?.schoolName ?? 'Your school'}
                          </span>
                        </div>
                      </div>

                      {issue.note && (
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[8px] block">Note</span>
                          <p className="text-[11px] leading-relaxed text-slate-600 bg-white rounded-lg p-2.5 border border-background-secondary/60 whitespace-pre-wrap shadow-sm">
                            {issue.note}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-navy-900 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm transition hover:bg-navy-50"
                        >
                          View Case
                        </Link>
                      </div>
                    </div>
                  </details>
                ))}
              </div>

              {/* Desktop Table (hidden on mobile/tablet) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 min-w-[150px]">Student</th>
                      <th className="px-6 py-3 min-w-[200px]">Category</th>
                      <th className="px-6 py-3 min-w-[120px]">Session</th>
                      <th className="px-6 py-3 min-w-[100px]">Amount</th>
                      <th className="px-6 py-3 min-w-[100px]">Status</th>
                      <th className="px-6 py-3 min-w-[150px]">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-secondary text-slate-600">
                    {issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 align-top">
                          <Link href={`/issues/${issue.id}`} className="font-semibold text-navy-900 hover:underline">{issue.studentName}</Link>
                          <p className="mt-1 text-[11px] text-slate-500">Parent: {issue.parentName}</p>
                          <p className="mt-1 text-[11px] text-slate-400">Reported {issue.createdAt.toISOString().slice(0, 10)}</p>
                          <Link href={`/issues/${issue.id}`} className="mt-2 inline-flex text-[11px] font-semibold text-navy-900 underline">View case history</Link>
                        </td>
                        <td className="px-6 py-4 align-top whitespace-normal">
                          <p className="font-medium text-navy-900">{getIssueCategoryLabel(issue.issueType)}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 max-w-sm whitespace-pre-wrap">{issue.note}</p>
                        </td>
                        <td className="px-6 py-4 align-top whitespace-nowrap">{issue.academicSession} · {issue.term}</td>
                        <td className="px-6 py-4 align-top font-semibold text-navy-900 whitespace-nowrap">{formatNairaFromKobo(issue.amountOwed)}</td>
                        <td className="px-6 py-4 align-top whitespace-nowrap">
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 font-semibold inline-block text-center',
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
                        <td className="px-6 py-4 align-top whitespace-normal max-w-[200px] break-words">
                          {actor?.schoolName ?? 'Your school'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </SchoolAppShell>
  );
}
