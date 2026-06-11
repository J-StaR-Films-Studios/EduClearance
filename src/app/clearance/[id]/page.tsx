import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { CopyMessageButton } from '@/components/workflows/copy-message-button';
import { DisputeModal } from '@/components/workflows/dispute-modal';
import { APP_NAME } from '@/lib/site';
import {
  buildWhatsAppHref,
  getOutboundClearance,
  NO_RECORD_DISCLAIMER,
  withRoleQuery,
} from '@/lib/demo-school-data';
import { formatNairaFromKobo } from '@/lib/money';
import { requireSchoolSession } from '@/lib/require-school-session';
import { noIndexMetadata } from '@/lib/seo';

type ClearanceDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ student?: string; parent?: string; phone?: string; previousSchool?: string; listed?: string; charged?: string }>;
};

export const metadata: Metadata = noIndexMetadata(`Clearance Request Result | ${APP_NAME}`, 'Private clearance result view.');

export default async function ClearanceDetailPage({ params, searchParams }: ClearanceDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const currentRole = await requireSchoolSession(`/clearance/${id}`);
  const clearance = getOutboundClearance(id);

  if (!clearance) {
    notFound();
  }

  const studentName = query.student?.trim() || clearance.studentName;
  const parentName = query.parent?.trim() || clearance.parentName;
  const parentPhone = query.phone?.trim() || clearance.parentPhone;
  const previousSchoolName = query.previousSchool?.trim() || clearance.previousSchoolName;
  const previousSchoolListed = query.listed ? query.listed === '1' : clearance.previousSchoolListed;
  const notificationHref = withRoleQuery('/clearance', currentRole);
  const chargedThisFlow = query.charged === '1';

  const noRecordMessage = `Hello ${previousSchoolName}, this is the Admitting Office at Grace Academy. We are processing the admission transfer for student ${studentName}. Please let us know if there are any outstanding clearances or issues to resolve. Thank you.`;
  const noRecordWhatsappHref = clearance.previousSchoolPhone
    ? buildWhatsAppHref(clearance.previousSchoolPhone, noRecordMessage)
    : undefined;
  const matchWhatsappHref = clearance.issue
    ? buildWhatsAppHref(clearance.issue.phone, `Hello ${clearance.issue.reportingSchool}, this is Grace Academy Admissions. We are reviewing the unresolved balance reported for ${studentName}. Kindly advise on the current status or update the record if it has been settled. Thank you.`)
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
            ₦100 clearance request charge has been simulated for this workflow. In production, the wallet debit and request creation should happen transactionally on the server.
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
            ) : (
              <div className="space-y-4 rounded-xl border border-background-secondary bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-navy-900">Contact &amp; Dispute Paths</h3>
                <p className="text-[11px] text-slate-500">Take action regarding this outstanding record:</p>

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
                  <DisputeModal />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SchoolAppShell>
  );
}
