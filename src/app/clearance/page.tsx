import type { Metadata } from 'next';
import Link from 'next/link';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { ClearanceHistoryTabs } from '@/components/workflows/clearance-history-tabs';
import { dashboardStats, withRoleQuery } from '@/lib/demo-school-data';
import { requireSchoolSession } from '@/lib/require-school-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

type ClearanceHistoryPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export const metadata: Metadata = noIndexMetadata(`Clearance History | ${APP_NAME}`, 'Private clearance request history.');

export default async function ClearanceHistoryPage({ searchParams }: ClearanceHistoryPageProps) {
  const [{ tab }, currentRole] = await Promise.all([searchParams, requireSchoolSession('/clearance')]);
  const initialTab = tab === 'inbound' ? 'inbound' : 'outbound';

  return (
    <SchoolAppShell activeKey="clearance" mobileMode="history" role={currentRole}>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-background-secondary pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Clearance History</h1>
            <p className="text-xs text-slate-500">Track checks your school started and requests sent to your school by others.</p>
          </div>
          <Link
            href={withRoleQuery('/clearance/new', currentRole)}
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-center text-xs font-medium text-white transition hover:bg-navy-800"
          >
            Start New Clearance
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Outbound checks</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{dashboardStats.outboundChecks}</p>
            <p className="text-xs text-slate-500">Started by Grace Academy</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inbound requests</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{dashboardStats.inboundRequests}</p>
            <p className="text-xs text-slate-500">Need your school response</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Open disputes</p>
            <p className="mt-1 text-2xl font-bold text-terracotta-600">{dashboardStats.openDisputes}</p>
            <p className="text-xs text-slate-500">Under admin review</p>
          </div>
        </section>

        <ClearanceHistoryTabs initialTab={initialTab} role={currentRole} />
      </div>
    </SchoolAppShell>
  );
}
