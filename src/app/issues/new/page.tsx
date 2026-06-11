import type { Metadata } from 'next';
import Link from 'next/link';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { IssueReportForm } from '@/components/workflows/issue-report-form';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';
import { requireSchoolSession } from '@/lib/require-school-session';
import { withRoleQuery } from '@/lib/demo-school-data';

export const metadata: Metadata = noIndexMetadata(`Report Unresolved Issue | ${APP_NAME}`, 'Private issue reporting form.');

type IssuesNewPageProps = {
  searchParams: Promise<{ source?: string }>;
};

export default async function IssuesNewPage({ searchParams }: IssuesNewPageProps) {
  const { source } = await searchParams;
  const currentRole = await requireSchoolSession('/issues/new');

  return (
    <SchoolAppShell activeKey="issues-new" role={currentRole}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="flex items-center justify-between border-b border-background-secondary pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Report Unresolved Issue</h1>
            <p className="text-xs text-slate-500">Record outstanding balances for departing students</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/issues" className="text-xs font-semibold text-navy-900 hover:underline">
              View Reported Issues
            </Link>
            <Link href={withRoleQuery('/dashboard', currentRole)} className="text-xs text-slate-500 hover:text-navy-900">
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

        <IssueReportForm fromInboundRequest={source === 'inbound'} />
      </div>
    </SchoolAppShell>
  );
}
