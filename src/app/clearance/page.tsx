import type { Metadata } from 'next';
import Link from 'next/link';
import { and, count, desc, eq } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { ClearanceHistoryTabs, type ClearanceHistoryInbound, type ClearanceHistoryOutbound } from '@/components/workflows/clearance-history-tabs';
import { db } from '@/db/client';
import { clearanceRequests, disputes, schools } from '@/db/schema';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { withRoleQuery } from '@/lib/local-school-data';
import { requireSchoolSession } from '@/lib/require-school-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

 type ClearanceHistoryPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export const metadata: Metadata = noIndexMetadata(`Clearance History | ${APP_NAME}`, 'Private clearance request history.');

function getRequestStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_verification: 'Pending verification',
    no_platform_record_found: 'No platform record found',
    previous_school_notified: 'Previous school notified',
    cleared_by_previous_school: 'Cleared by previous school',
    outstanding_balance_reported: 'Outstanding balance reported',
    disputed: 'Disputed',
    no_response: 'No response',
    previous_school_not_on_platform: 'Previous school not on platform',
    closed: 'Closed',
  };

  return labels[status] ?? status;
}

function getResultState(searchResult: string): ClearanceHistoryOutbound['resultState'] {
  if (searchResult === 'confirmed_match') {
    return 'match';
  }

  if (searchResult === 'possible_match') {
    return 'possible_match';
  }

  return 'no_record';
}

function getInboundStatus(status: string, searchResult: string): ClearanceHistoryInbound['status'] {
  if (status === 'cleared_by_previous_school' || status === 'closed') {
    return 'resolved';
  }

  return searchResult === 'possible_match' ? 'potential_response' : 'response_needed';
}

export default async function ClearanceHistoryPage({ searchParams }: ClearanceHistoryPageProps) {
  const [{ tab }, currentRole] = await Promise.all([searchParams, requireSchoolSession('/clearance')]);
  const actor = await resolveLocalSchoolActor();
  const initialTab = tab === 'inbound' ? 'inbound' : 'outbound';

  let outboundRows: {
    id: string;
    studentName: string;
    previousSchoolName: string;
    searchResult: string;
    status: string;
    amountCharged: number;
  }[] = [];
  let inboundRows: {
    id: string;
    studentName: string;
    requestingSchool: string;
    status: string;
    searchResult: string;
    createdAt: Date;
  }[] = [];
  let openDisputeCount = { value: 0 };

  if (actor) {
    const [outboundResult, inboundResult, disputeCountResult] = await Promise.all([
      db
        .select({
          id: clearanceRequests.id,
          studentName: clearanceRequests.studentName,
          previousSchoolName: clearanceRequests.previousSchoolNameSnapshot,
          searchResult: clearanceRequests.searchResult,
          status: clearanceRequests.status,
          amountCharged: clearanceRequests.amountCharged,
        })
        .from(clearanceRequests)
        .where(eq(clearanceRequests.incomingSchoolId, actor.schoolId))
        .orderBy(desc(clearanceRequests.createdAt))
        .limit(100),
      db
        .select({
          id: clearanceRequests.id,
          studentName: clearanceRequests.studentName,
          requestingSchool: schools.name,
          status: clearanceRequests.status,
          searchResult: clearanceRequests.searchResult,
          createdAt: clearanceRequests.createdAt,
        })
        .from(clearanceRequests)
        .innerJoin(schools, eq(schools.id, clearanceRequests.incomingSchoolId))
        .where(eq(clearanceRequests.previousSchoolId, actor.schoolId))
        .orderBy(desc(clearanceRequests.createdAt))
        .limit(100),
      db
        .select({ value: count() })
        .from(disputes)
        .where(and(eq(disputes.raisedBySchoolId, actor.schoolId), eq(disputes.status, 'open'))),
    ]);

    outboundRows = outboundResult;
    inboundRows = inboundResult;
    openDisputeCount = disputeCountResult[0] ?? { value: 0 };
  }

  const outboundClearances: ClearanceHistoryOutbound[] = outboundRows.map((request) => ({
    id: request.id,
    studentName: request.studentName,
    previousSchoolName: request.previousSchoolName,
    resultState: getResultState(request.searchResult),
    statusLabel: getRequestStatusLabel(request.status),
    amountChargedKobo: request.amountCharged,
  }));
  const inboundRequests: ClearanceHistoryInbound[] = inboundRows.map((request) => ({
    id: request.id,
    studentName: request.studentName,
    requestingSchool: request.requestingSchool,
    requestedAt: request.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    status: getInboundStatus(request.status, request.searchResult),
  }));
  const activeInboundCount = inboundRequests.filter((request) => request.status !== 'resolved').length;

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
            <p className="mt-1 text-2xl font-bold text-navy-900">{outboundClearances.length}</p>
            <p className="text-xs text-slate-500">Started by your school</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inbound requests</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{activeInboundCount}</p>
            <p className="text-xs text-slate-500">Need your school response</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Open disputes</p>
            <p className="mt-1 text-2xl font-bold text-terracotta-600">{openDisputeCount.value}</p>
            <p className="text-xs text-slate-500">Under admin review</p>
          </div>
        </section>

        <ClearanceHistoryTabs initialTab={initialTab} role={currentRole} outboundClearances={outboundClearances} inboundRequests={inboundRequests} />
      </div>
    </SchoolAppShell>
  );
}
