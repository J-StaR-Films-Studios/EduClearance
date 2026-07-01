import type { Metadata } from 'next';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { CaseTimelinePanel } from '@/components/workflows/case-timeline-panel';
import { db } from '@/db/client';
import { caseTimelineEntries, clearanceIssues, clearanceRequests, disputes, schools } from '@/db/schema';
import { isPlatformAdminActor, resolveOptionalLocalActor } from '@/lib/local-actor';
import { type SchoolUserRole } from '@/lib/local-school-data';
import { formatNairaFromKobo } from '@/lib/money';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = noIndexMetadata(`Issue Case | ${APP_NAME}`, 'Private issue case detail.');

type IssueDetailPageProps = {
  params: Promise<{ id: string }>;
};

function issueTypeLabel(issueType: string) {
  const labels: Record<string, string> = {
    school_fees: 'Outstanding School Fees',
    books: 'Books / Learning Materials',
    uniform: 'Uniform / Materials',
    transport: 'Transport',
    other: 'Other Obligation',
  };

  return labels[issueType] ?? 'Other Obligation';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    unresolved: 'Unresolved',
    disputed: 'Under review',
    resolved: 'Resolved',
    withdrawn: 'Withdrawn',
  };

  return labels[status] ?? status;
}

async function authorLabel(authorSchoolId: string | null, authorUserId: string | null) {
  if (authorSchoolId) {
    const [school] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, authorSchoolId)).limit(1);
    return school?.name ?? 'School update';
  }

  return authorUserId ? 'Platform admin' : 'System';
}

async function getIssueTimeline(issueId: string) {
  const issueEntries = await db
    .select()
    .from(caseTimelineEntries)
    .where(and(eq(caseTimelineEntries.entityType, 'clearance_issue'), eq(caseTimelineEntries.entityId, issueId)));

  const disputeRows = await db.select({ id: disputes.id }).from(disputes).where(eq(disputes.clearanceIssueId, issueId));
  const disputeEntries = (await Promise.all(disputeRows.map((dispute) => db
    .select()
    .from(caseTimelineEntries)
    .where(and(eq(caseTimelineEntries.entityType, 'dispute'), eq(caseTimelineEntries.entityId, dispute.id)))))).flat();

  return Promise.all([...issueEntries, ...disputeEntries]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(async (entry) => ({
      id: entry.id,
      entryType: entry.entryType,
      body: entry.body,
      authorLabel: await authorLabel(entry.authorSchoolId, entry.authorUserId),
      createdAt: entry.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      attachmentFileName: entry.attachmentFileName,
      attachmentFileSize: entry.attachmentFileSize,
    })));
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = await params;
  const actor = await resolveOptionalLocalActor();

  if (!actor) {
    notFound();
  }

  const [issue] = await db.select().from(clearanceIssues).where(eq(clearanceIssues.id, id)).limit(1);

  if (!issue) {
    notFound();
  }

  const [linkedRequest] = issue.clearanceRequestId
    ? await db.select().from(clearanceRequests).where(eq(clearanceRequests.id, issue.clearanceRequestId)).limit(1)
    : [null];

  const canView = isPlatformAdminActor(actor) || issue.reportingSchoolId === actor.schoolId || linkedRequest?.incomingSchoolId === actor.schoolId || linkedRequest?.previousSchoolId === actor.schoolId;
  const isPossibleLinkedRequest = linkedRequest?.searchResult === 'possible_match';
  const canResolveIssue = !isPlatformAdminActor(actor) && issue.reportingSchoolId === actor.schoolId && !isPossibleLinkedRequest;

  if (!canView) {
    notFound();
  }

  const [[reportingSchool], [incomingSchool], timelineEntries] = await Promise.all([
    db.select({ name: schools.name }).from(schools).where(eq(schools.id, issue.reportingSchoolId)).limit(1),
    linkedRequest ? db.select({ name: schools.name }).from(schools).where(eq(schools.id, linkedRequest.incomingSchoolId)).limit(1) : Promise.resolve([]),
    getIssueTimeline(issue.id),
  ]);

  return (
    <SchoolAppShell activeKey="issues-new" mobileMode="detail" role={(isPlatformAdminActor(actor) ? 'school_admin' : actor.sessionRole) as SchoolUserRole}>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 space-y-6">
        <header className="flex flex-col gap-4 border-b border-background-secondary pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Student issue case</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-900 break-words">{issue.studentName}</h1>
            <p className="mt-1 text-xs text-slate-500 break-words">Parent: {issue.parentName} · {issue.parentPhone}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {linkedRequest ? (
              <Link href={`/clearance/${linkedRequest.id}`} className="text-xs font-semibold text-navy-900 hover:underline whitespace-nowrap">
                View linked request context
              </Link>
            ) : null}
            <Link href="/issues" className="text-xs text-slate-500 hover:text-navy-900 whitespace-nowrap">
              ← Back
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-background-secondary bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</p>
            <div className="mt-1">
              <span className={cn(
                'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
                issue.status === 'resolved'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : issue.status === 'disputed'
                    ? 'border-amber-100 bg-amber-50 text-amber-700'
                    : 'border-terracotta-100 bg-terracotta-50 text-terracotta-700',
              )}>{statusLabel(issue.status)}</span>
            </div>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</p>
            <p className="mt-1 text-2xl font-bold text-navy-900 whitespace-nowrap">{formatNairaFromKobo(issue.amountOwed)}</p>
          </div>
          <div className="rounded-xl border border-background-secondary bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Reporting school</p>
            <p className="mt-1 text-sm font-semibold text-navy-900 break-words leading-tight">{reportingSchool?.name ?? 'Reporting school'}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-background-secondary bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy-900">Issue details</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="break-words"><span className="font-semibold text-navy-900">Category:</span> {issueTypeLabel(issue.issueType)}</p>
            <p className="break-words"><span className="font-semibold text-navy-900">Session:</span> {issue.academicSession} · {issue.term}</p>
            <p className="break-words"><span className="font-semibold text-navy-900">Reported:</span> {issue.createdAt.toISOString().slice(0, 10)}</p>
            <p className="break-words"><span className="font-semibold text-navy-900">Requesting school:</span> {incomingSchool?.name ?? 'Not linked'}</p>
          </div>
          <p className="mt-4 rounded-xl border border-background-secondary bg-background p-4 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap break-words">{issue.note}</p>
        </section>

        <CaseTimelinePanel
          entityType="clearance_issue"
          entityId={issue.id}
          entries={timelineEntries}
          resolutionAction={canResolveIssue ? { issueId: issue.id, initialResolved: issue.status === 'resolved' } : undefined}
          blockedResolutionAction={!isPlatformAdminActor(actor) && issue.reportingSchoolId === actor.schoolId && isPossibleLinkedRequest ? {
            reason: 'This issue is linked to a possible match, not a confirmed exact request. Ask the requesting school to use their one correction if the school/name was typed incorrectly; the clear action unlocks after the request becomes confirmed.',
          } : undefined}
        />
      </div>
    </SchoolAppShell>
  );
}
