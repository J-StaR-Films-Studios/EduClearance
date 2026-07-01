import type { Metadata } from 'next';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { IssueReportForm } from '@/components/workflows/issue-report-form';
import { db } from '@/db/client';
import { clearanceRequests, schools } from '@/db/schema';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';
import { requireSchoolSession } from '@/lib/require-school-session';
import { withRoleQuery } from '@/lib/local-school-data';

export const metadata: Metadata = noIndexMetadata(`Report Unresolved Issue | ${APP_NAME}`, 'Private issue reporting form.');

type IssuesNewPageProps = {
  searchParams: Promise<{ source?: string; requestId?: string }>;
};

export default async function IssuesNewPage({ searchParams }: IssuesNewPageProps) {
  const { source, requestId } = await searchParams;
  const currentRole = await requireSchoolSession('/issues/new');
  const actor = await resolveLocalSchoolActor();
  const inboundRequest = source === 'inbound' && requestId && actor
    ? await db
        .select({
          id: clearanceRequests.id,
          studentName: clearanceRequests.studentName,
          lastClass: clearanceRequests.lastClass,
          parentName: clearanceRequests.parentName,
          parentPhone: clearanceRequests.parentPhone,
          requestingSchoolName: schools.name,
          requestedAt: clearanceRequests.createdAt,
        })
        .from(clearanceRequests)
        .leftJoin(schools, eq(schools.id, clearanceRequests.incomingSchoolId))
        .where(and(eq(clearanceRequests.id, requestId), eq(clearanceRequests.previousSchoolId, actor.schoolId)))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  return (
    <SchoolAppShell activeKey="issues-new" role={currentRole}>
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 space-y-6">
        <header className="flex flex-col gap-4 border-b border-background-secondary pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Report Unresolved Issue</h1>
            <p className="text-xs text-slate-500">Record outstanding balances for departing students</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <Link
              href="/issues"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm hover:bg-slate-50 hover:text-navy-950 transition-colors whitespace-nowrap"
            >
              <span>View Reported Issues</span>
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href={withRoleQuery('/dashboard', currentRole)} className="text-xs text-slate-500 hover:text-navy-900 whitespace-nowrap">
              ← Back
            </Link>
          </div>
        </header>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-700">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p>
            <strong>Reporting is Free:</strong> Help keep the cluster network secure and encourage collaborative school verification. There are no wallet deductions for reporting an issue.
          </p>
        </div>

        <IssueReportForm
          fromInboundRequest={source === 'inbound'}
          inboundRequest={inboundRequest ? {
            id: inboundRequest.id,
            studentName: inboundRequest.studentName,
            lastClass: inboundRequest.lastClass,
            parentName: inboundRequest.parentName,
            parentPhone: inboundRequest.parentPhone,
            requestingSchoolName: inboundRequest.requestingSchoolName ?? 'Requesting school',
            requestedAt: inboundRequest.requestedAt.toISOString(),
          } : null}
        />
      </div>
    </SchoolAppShell>
  );
}
