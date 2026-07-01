import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db } from '@/db/client';
import { schoolClaims } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth-session';
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Pending Verification | ${APP_NAME}`, 'School account verification status.');

const MAX_SCHOOL_CLAIM_APPEALS = 3;

function supportHref(schoolName: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`EduClearance school claim support: ${schoolName}`)}`;
}

export default async function PendingVerificationPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login?redirect=/account/pending-verification');
  }

  if (user.schoolId || user.userRole === 'platform_admin') {
    redirect(user.userRole === 'platform_admin' ? '/admin' : '/dashboard');
  }

  const claims = await db
    .select({
      id: schoolClaims.id,
      requestedSchoolName: schoolClaims.requestedSchoolName,
      requestedArea: schoolClaims.requestedArea,
      officialEmail: schoolClaims.officialEmail,
      officialPhone: schoolClaims.officialPhone,
      officialWhatsappPhone: schoolClaims.officialWhatsappPhone,
      proofFileName: schoolClaims.proofFileName,
      status: schoolClaims.status,
      adminNote: schoolClaims.adminNote,
      createdAt: schoolClaims.createdAt,
      reviewedAt: schoolClaims.reviewedAt,
    })
    .from(schoolClaims)
    .where(eq(schoolClaims.applicantUserId, user.userId))
    .orderBy(desc(schoolClaims.createdAt))
    .limit(10);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8 text-navy-900">
      <section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-background-secondary bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-background-secondary pb-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-navy-900 hover:opacity-80">
            <span className="rounded-lg bg-navy-900 px-2.5 py-1 text-white">EC</span>
            <span className="truncate">EduClearance</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500">One school claim per account</span>
        </div>

        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Your school account is waiting for verification</h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
            You can sign in, but clearance tools stay locked until a submitted school claim is approved. If a claim is rejected, you can submit updated proof from this account until the online appeal limit is reached.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted claims</h2>
          {claims.length === 0 ? (
            <div className="rounded-xl border border-background-secondary bg-background p-4 text-sm text-slate-600">
              No claim has been submitted from this account yet. Start the school claim flow to begin verification.
              <Link href="/claim-school" className="ml-1 font-semibold text-navy-900 hover:underline">Claim your school</Link>.
            </div>
          ) : claims.map((claim) => {
            const attemptCount = claims.filter((item) => item.requestedSchoolName === claim.requestedSchoolName).length;
            const reachedAppealLimit = claim.status === 'rejected' && attemptCount >= MAX_SCHOOL_CLAIM_APPEALS;

            return (
              <div key={claim.id} className="rounded-xl border border-background-secondary bg-background p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-900 break-words">{claim.requestedSchoolName}</p>
                    <p className="text-xs text-slate-500 break-words">{claim.requestedArea}</p>
                  </div>
                  <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase text-amber-700 whitespace-nowrap flex-shrink-0">{claim.status}</span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <p className="break-all">Official email: {claim.officialEmail}</p>
                  <p className="break-words">Official phone: {claim.officialPhone}</p>
                  <p className="break-words">WhatsApp line: {claim.officialWhatsappPhone ?? claim.officialPhone}</p>
                  <p className="break-all">Proof file: {claim.proofFileName}</p>
                  <p className="break-words">Submitted: {claim.createdAt.toISOString().slice(0, 10)}</p>
                  <p className="break-words">Online attempts: {Math.min(attemptCount, MAX_SCHOOL_CLAIM_APPEALS)} of {MAX_SCHOOL_CLAIM_APPEALS}</p>
                </div>
                {claim.adminNote ? <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-600 break-words">Admin note: {claim.adminNote}</p> : null}
                {claim.status === 'rejected' && !reachedAppealLimit ? (
                  <div className="mt-3 rounded-lg border border-terracotta-200 bg-terracotta-50 p-3 text-xs leading-relaxed text-terracotta-800">
                    Your claim was rejected. Review the admin note, then submit updated proof from the same account.{' '}
                    <Link href="/claim-school" className="font-semibold underline">Resubmit verification</Link>
                  </div>
                ) : null}
                {reachedAppealLimit ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                    This account has reached the online appeal limit for this school. Contact support directly so we can review your documents manually.{' '}
                    <a href={supportHref(claim.requestedSchoolName)} className="font-semibold underline">Email support</a>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
