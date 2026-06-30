import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { CopyMessageButton } from '@/components/workflows/copy-message-button';
import { CaseTimelinePanel } from '@/components/workflows/case-timeline-panel';
import { DisputeModal } from '@/components/workflows/dispute-modal';
import { IssueResolutionPanel } from '@/components/workflows/issue-resolution-panel';
import { db } from '@/db/client';
import { caseTimelineEntries, clearanceIssues, clearanceRequests, disputes, schools } from '@/db/schema';
import {
  buildWhatsAppHref,
  NO_RECORD_DISCLAIMER,
  type OutboundClearance,
  type SchoolUserRole,
  withRoleQuery,
} from '@/lib/local-school-data';
import { resolveOptionalLocalActor, type LocalActor } from '@/lib/local-actor';
import { formatNairaFromKobo } from '@/lib/money';
import { noIndexMetadata } from '@/lib/seo';
import { APP_NAME } from '@/lib/site';

type ClearanceDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ student?: string; parent?: string; phone?: string; previousSchool?: string; listed?: string; charged?: string }>;
};

type DatabaseClearanceDetail = {
  clearance: OutboundClearance;
  incomingSchoolId: string;
  previousSchoolId: string | null;
  reportingSchoolId: string | null;
  issueId: string | null;
};

export const metadata: Metadata = noIndexMetadata(`Clearance Request Result | ${APP_NAME}`, 'Private clearance result view.');

function getIssueCategoryLabel(issueType: string) {
  const labels: Record<string, string> = {
    school_fees: 'Outstanding School Fees',
    books: 'Books / Learning Materials',
    uniform: 'Uniform / Materials',
    transport: 'Transport',
    other: 'Other Obligation',
  };

  return labels[issueType] ?? 'Outstanding Obligation';
}

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

async function getDatabaseOutboundClearance(id: string): Promise<DatabaseClearanceDetail | null> {
  const [request] = await db
    .select()
    .from(clearanceRequests)
    .where(eq(clearanceRequests.id, id))
    .limit(1);

  if (!request) {
    return null;
  }

  const [[incomingSchool], [previousSchool], [issue]] = await Promise.all([
    db.select().from(schools).where(eq(schools.id, request.incomingSchoolId)).limit(1),
    request.previousSchoolId ? db.select().from(schools).where(eq(schools.id, request.previousSchoolId)).limit(1) : Promise.resolve([]),
    db.select().from(clearanceIssues).where(eq(clearanceIssues.clearanceRequestId, request.id)).limit(1),
  ]);

  const [reportingSchool] = issue
    ? await db.select().from(schools).where(eq(schools.id, issue.reportingSchoolId)).limit(1)
    : [null];
  const incomingSchoolName = incomingSchool?.name ?? 'the admitting school';
  const previousSchoolName = previousSchool?.name ?? request.previousSchoolNameSnapshot;
  const resultState = request.searchResult === 'no_match' ? 'no_record' : request.searchResult === 'possible_match' ? 'possible_match' : 'match';
  const noRecordMessage = `Hello ${previousSchoolName}, this is the Admitting Office at ${incomingSchoolName}. We are processing the admission transfer for student ${request.studentName}. Please let us know if there are any outstanding clearances or issues to resolve. Thank you.`;

  return {
    incomingSchoolId: request.incomingSchoolId,
    previousSchoolId: request.previousSchoolId,
    reportingSchoolId: issue?.reportingSchoolId ?? null,
    issueId: issue?.id ?? null,
    clearance: {
      id: request.id,
      studentName: request.studentName,
      parentName: request.parentName,
      parentPhone: request.parentPhone,
      previousSchoolName,
      previousSchoolPhone: previousSchool?.clearancePhone ?? previousSchool?.mainPhone ?? undefined,
      previousSchoolEmail: previousSchool?.contactEmail ?? undefined,
      previousSchoolListed: Boolean(previousSchool),
      gender: request.gender ?? '',
      lastClass: request.lastClass ?? '',
      createdAt: request.createdAt.toISOString().slice(0, 10),
      resultLabel:
        request.searchResult === 'no_match'
          ? 'No Platform Record Found'
          : request.searchResult === 'possible_match'
            ? 'Possible Record Requires Review'
            : 'Unresolved Balance Reported',
      resultState,
      statusLabel: getRequestStatusLabel(request.status),
      searchResult: request.searchResult,
      amountChargedKobo: request.amountCharged,
      notificationStatus: request.notificationStatus,
      whatsappMessage: noRecordMessage,
      issue: issue
        ? {
            reportingSchool: reportingSchool?.name ?? 'Reporting school',
            amountOwedKobo: issue.amountOwed,
            category: getIssueCategoryLabel(issue.issueType),
            sessionTerm: `${issue.academicSession} - ${issue.term}`,
            note: issue.note,
            phone: reportingSchool?.clearancePhone ?? reportingSchool?.mainPhone ?? issue.parentPhone,
            whatsappMessage: `Hello ${reportingSchool?.name ?? previousSchoolName}, this is ${incomingSchoolName}. We are reviewing the unresolved balance reported for ${request.studentName}. Kindly advise on the current status or update the record if it has been settled. Thank you.`,
          }
        : undefined,
    },
  };
}

function canViewDatabaseClearance(actor: LocalActor, detail: DatabaseClearanceDetail) {
  if (actor.sessionRole === 'platform_admin') {
    return true;
  }

  return (
    actor.schoolId === detail.incomingSchoolId ||
    actor.schoolId === detail.previousSchoolId ||
    actor.schoolId === detail.reportingSchoolId
  );
}

type TimelineEntryView = {
  id: string;
  entryType: string;
  body: string;
  authorLabel: string;
  createdAt: string;
  attachmentFileName: string | null;
  attachmentFileSize: number | null;
};

async function getAuthorLabel(authorSchoolId: string | null, authorUserId: string | null) {
  if (authorSchoolId) {
    const [school] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, authorSchoolId)).limit(1);
    return school?.name ?? 'School update';
  }

  return authorUserId ? 'Platform admin' : 'System';
}

async function getCaseTimeline(clearanceRequestId: string, issueId: string | null): Promise<TimelineEntryView[]> {
  const requestEntries = await db
    .select()
    .from(caseTimelineEntries)
    .where(and(eq(caseTimelineEntries.entityType, 'clearance_request'), eq(caseTimelineEntries.entityId, clearanceRequestId)));

  const issueEntries = issueId
    ? await db
        .select()
        .from(caseTimelineEntries)
        .where(and(eq(caseTimelineEntries.entityType, 'clearance_issue'), eq(caseTimelineEntries.entityId, issueId)))
    : [];

  const disputeRows = await db.select({ id: disputes.id }).from(disputes).where(eq(disputes.clearanceRequestId, clearanceRequestId));
  const disputeEntries = (await Promise.all(disputeRows.map((dispute) => db
    .select()
    .from(caseTimelineEntries)
    .where(and(eq(caseTimelineEntries.entityType, 'dispute'), eq(caseTimelineEntries.entityId, dispute.id)))))).flat();

  const entries = [...requestEntries, ...issueEntries, ...disputeEntries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return Promise.all(entries.map(async (entry) => ({
    id: entry.id,
    entryType: entry.entryType,
    body: entry.body,
    authorLabel: await getAuthorLabel(entry.authorSchoolId, entry.authorUserId),
    createdAt: entry.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    attachmentFileName: entry.attachmentFileName,
    attachmentFileSize: entry.attachmentFileSize,
  })));
}

function applyMessageOverrides(message: string, clearance: OutboundClearance, studentName: string, previousSchoolName: string) {
  return message
    .replaceAll(clearance.studentName, studentName)
    .replaceAll(clearance.previousSchoolName, previousSchoolName);
}

export default async function ClearanceDetailPage({ params, searchParams }: ClearanceDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const actor = await resolveOptionalLocalActor();

  if (!actor) {
    notFound();
  }

  const databaseDetail = await getDatabaseOutboundClearance(id);

  if (databaseDetail && !canViewDatabaseClearance(actor, databaseDetail)) {
    notFound();
  }

  if (!databaseDetail) {
    notFound();
  }

  const currentRole: SchoolUserRole = actor.sessionRole === 'platform_admin' ? 'school_admin' : actor.sessionRole;
  const clearance = databaseDetail.clearance;

  const studentName = query.student?.trim() || clearance.studentName;
  const parentName = query.parent?.trim() || clearance.parentName;
  const parentPhone = query.phone?.trim() || clearance.parentPhone;
  const previousSchoolName = query.previousSchool?.trim() || clearance.previousSchoolName;
  const previousSchoolListed = query.listed ? query.listed === '1' : clearance.previousSchoolListed;
  const notificationHref = actor.sessionRole === 'platform_admin' ? '/admin/clearance' : withRoleQuery('/clearance', currentRole);
  const chargedThisFlow = query.charged === '1';
  const caseTimeline = await getCaseTimeline(clearance.id, databaseDetail.issueId);
  const isIncomingSchoolViewer = actor.sessionRole === 'platform_admin' || actor.schoolId === databaseDetail.incomingSchoolId;
  const canResolveLinkedIssue = Boolean(databaseDetail.issueId && actor.schoolId === databaseDetail.reportingSchoolId);

  const noRecordMessage = applyMessageOverrides(clearance.whatsappMessage, clearance, studentName, previousSchoolName);
  const noRecordWhatsappHref = clearance.previousSchoolPhone
    ? buildWhatsAppHref(clearance.previousSchoolPhone, noRecordMessage)
    : undefined;
  const issueWhatsappMessage = clearance.issue
    ? applyMessageOverrides(clearance.issue.whatsappMessage, clearance, studentName, previousSchoolName)
    : undefined;
  const matchWhatsappHref = clearance.issue && issueWhatsappMessage
    ? buildWhatsAppHref(clearance.issue.phone, issueWhatsappMessage)
    : undefined;

  return (
    <SchoolAppShell activeKey="dashboard" mobileMode="detail" role={currentRole}>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between border-b border-background-secondary pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Clearance Request Result</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-900">{studentName}</h1>
          </div>
          <Link href={notificationHref} className="text-xs text-slate-500 hover:text-navy-900">
            ← Close
          </Link>
        </div>

        {chargedThisFlow ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-700">
            Wallet debit and request creation were posted together for this clearance request.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {clearance.resultState === 'no_record' ? (
              <>
                <div className="flex">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/20 bg-emerald-50/40 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-sm bg-emerald-600" />
                    No Platform Record Found
                  </span>
                </div>

                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Important Notice
                  </div>
                  <p className="font-medium text-amber-900">{NO_RECORD_DISCLAIMER}</p>
                </div>

                <div className="space-y-3 rounded-xl border border-background-secondary bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy-900">Generated WhatsApp Message Preview</span>
                    <CopyMessageButton message={noRecordMessage} />
                  </div>
                  <p className="rounded-lg border border-background-secondary bg-background p-3 text-xs leading-relaxed text-slate-600">
                    {noRecordMessage}
                  </p>
                </div>
              </>
            ) : clearance.resultState === 'possible_match' ? (
              <>
                <div className="flex">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/20 bg-amber-50/40 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <span className="h-2 w-2 rounded-sm bg-amber-600" />
                    Possible Record Requires Review
                  </span>
                </div>

                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
                  <h3 className="font-bold text-amber-800">Same-name record found</h3>
                  <p className="font-medium text-amber-900">
                    A same-name unresolved issue exists, but the parent phone number did not match exactly. Treat this as a review item, not a confirmed obligation.
                  </p>
                  <p className="text-xs text-amber-800">
                    Contact the previous school through official channels before taking admissions or dispute action on this request.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-terracotta-600/20 bg-terracotta-50/40 px-2.5 py-1 text-xs font-semibold text-terracotta-700">
                    <span className="h-2 w-2 rounded-sm bg-terracotta-600" />
                    Unresolved Balance Reported
                  </span>
                </div>

                <div className="space-y-4 rounded-xl border border-background-secondary bg-white p-6 shadow-sm">
                  <h3 className="border-b border-background-secondary pb-2 text-lg font-bold text-navy-900">Outstanding Obligation Details</h3>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-4 text-xs">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Reporting School</p>
                      <p className="text-sm font-semibold text-navy-900">{clearance.issue?.reportingSchool}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Outstanding Amount Owed</p>
                      <p className="text-sm font-bold text-terracotta-700">
                        {clearance.issue ? formatNairaFromKobo(clearance.issue.amountOwedKobo) : null}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Issue Category</p>
                      <p className="font-semibold text-navy-900">{clearance.issue?.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Academic Term</p>
                      <p className="font-medium text-slate-700">{clearance.issue?.sessionTerm}</p>
                    </div>
                    <div className="col-span-2 pt-2">
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Official School Note</p>
                      <p className="mt-1 rounded-lg border border-background-secondary bg-background p-3 leading-relaxed text-slate-600">
                        &quot;{clearance.issue?.note}&quot;
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Parent / Guardian</p>
                      <p className="font-semibold text-navy-900">{parentName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Parent Phone</p>
                      <p className="font-medium text-slate-700">{parentPhone}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            {clearance.resultState === 'no_record' ? (
              <div className="space-y-4 rounded-xl border border-background-secondary bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-navy-900">Previous School Contact</h3>
                <p className="text-[11px] text-slate-500">Contact information registered in directory:</p>

                <div className="space-y-3 border-t border-background-secondary pt-3 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">School Name</p>
                    <p className="font-semibold text-navy-900">{previousSchoolName}</p>
                  </div>
                  {previousSchoolListed ? (
                    <>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-400">Clearance Contact</p>
                        <p className="font-semibold text-navy-900">{clearance.previousSchoolPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-400">Clearance Office Email</p>
                        <p className="text-slate-600">{clearance.previousSchoolEmail}</p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                      This school is not yet listed in the EduClearance directory. Contact the previous school directly using their official clearance line.
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  {previousSchoolListed && clearance.previousSchoolPhone ? (
                    <>
                      <a
                        href={`tel:${clearance.previousSchoolPhone.replace(/\s+/g, '')}`}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-center text-xs font-medium text-white transition hover:bg-navy-800"
                      >
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call Clearance Office
                      </a>
                      {noRecordWhatsappHref ? (
                        <a
                          href={noRecordWhatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-background-secondary bg-white py-2.5 text-center text-xs font-medium text-navy-900 transition hover:bg-background-secondary"
                        >
                          <svg className="h-4 w-4 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.57 1.98 14.103.953 11.5.953c-5.447 0-9.875 4.377-9.879 9.807-.002 1.812.483 3.582 1.405 5.176l-.922 3.37 3.453-.902zm12.39-7.143c-.327-.162-1.933-.941-2.232-1.049-.3-.11-.519-.165-.737.163-.218.328-.84.841-1.03 1.059-.19.218-.379.245-.705.082-.327-.162-1.378-.501-2.625-1.603-.97-.854-1.624-1.909-1.814-2.234-.19-.328-.02-.505.143-.668.147-.146.327-.379.49-.569.164-.189.219-.328.327-.547.11-.218.055-.41-.027-.573-.082-.164-.737-1.758-1.01-2.407-.265-.63-.53-.545-.73-.555-.19-.01-.408-.01-.625-.01-.218 0-.573.082-.873.41-.3.328-1.147 1.109-1.147 2.7 0 1.591 1.173 3.129 1.336 3.348.163.218 2.308 3.483 5.592 4.887.781.334 1.39.533 1.867.683.784.246 1.498.211 2.06.126.628-.094 1.933-.78 2.205-1.53.272-.751.272-1.396.19-1.53-.081-.135-.298-.217-.625-.379z" />
                          </svg>
                          Send WhatsApp Draft
                        </a>
                      ) : null}
                    </>
                  ) : null}
                  <button type="button" className="w-full rounded-lg border border-background-secondary bg-background py-2.5 text-xs font-semibold text-navy-900 transition hover:bg-background-secondary">
                    Close After Manual Verification
                  </button>
                </div>
              </div>
            ) : clearance.resultState === 'possible_match' ? (
              <div className="space-y-4 rounded-xl border border-background-secondary bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-navy-900">Review Required</h3>
                <p className="text-[11px] text-slate-500">
                  This request has a same-name possible match. Do not treat it as a confirmed outstanding record until school staff verify the parent details.
                </p>
                <div className="space-y-3 border-t border-background-secondary pt-3 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Previous School</p>
                    <p className="font-semibold text-navy-900">{previousSchoolName}</p>
                  </div>
                  {clearance.previousSchoolPhone ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Clearance Office Phone</p>
                      <p className="font-semibold text-navy-900">{clearance.previousSchoolPhone}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : canResolveLinkedIssue && databaseDetail.issueId ? (
              <IssueResolutionPanel issueId={databaseDetail.issueId} initialResolved={clearance.statusLabel === 'Cleared by previous school'} />
            ) : (
              <div className="space-y-4 rounded-xl border border-background-secondary bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-navy-900">{isIncomingSchoolViewer ? 'Contact & Dispute Paths' : 'Case context'}</h3>
                <p className="text-[11px] text-slate-500">
                  {isIncomingSchoolViewer ? 'Take action regarding this outstanding record:' : 'This linked request is shown for context. The admitting school owns dispute actions.'}
                </p>

                <div className="space-y-3 border-t border-background-secondary pt-3 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Reporting School</p>
                    <p className="font-semibold text-navy-900">{clearance.issue?.reportingSchool}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Clearance Office Phone</p>
                    <p className="font-semibold text-navy-900">{clearance.issue?.phone}</p>
                  </div>
                </div>

                {isIncomingSchoolViewer ? (
                  <div className="space-y-2 pt-2">
                    {clearance.issue?.phone ? (
                      <a
                        href={`tel:${clearance.issue.phone.replace(/\s+/g, '')}`}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-center text-xs font-medium text-white transition hover:bg-navy-800"
                      >
                        {`Contact ${previousSchoolName}`}
                      </a>
                    ) : null}
                    {matchWhatsappHref ? (
                      <a
                        href={matchWhatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-background-secondary bg-white py-2.5 text-center text-xs font-medium text-navy-900 transition hover:bg-background-secondary"
                      >
                        Message Previous School on WhatsApp
                      </a>
                    ) : null}
                    <DisputeModal clearanceRequestId={clearance.id} />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <CaseTimelinePanel entityType="clearance_request" entityId={clearance.id} entries={caseTimeline} />
      </div>
    </SchoolAppShell>
  );
}
