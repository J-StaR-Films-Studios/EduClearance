import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db } from '@/db/client';
import { schoolClaims } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Pending Verification | ${APP_NAME}`, 'School account verification status.');

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
    <main className="min-h-screen bg-background px-4 py-10 text-navy-900">
      <section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-background-secondary pb-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-navy-900 hover:opacity-80">
            <span className="rounded-lg bg-navy-900 px-2.5 py-1 text-white">EC</span>
            EduClearance
          </Link>
          <Link href="/claim-school" className="text-xs font-semibold text-navy-900 hover:underline">Submit another claim</Link>
        </div>

        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Your school account is waiting for verification</h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
            You can sign in, but clearance tools stay locked until a submitted school claim is approved. If this is urgent, contact the platform admin with your school name and official phone number.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Submitted claims</h2>
          {claims.length === 0 ? (
            <div className="rounded-xl border border-background-secondary bg-background p-4 text-sm text-slate-600">
              No claim has been submitted from this account yet. Search the directory or request a new school profile to begin verification.
            </div>
          ) : claims.map((claim) => (
            <div key={claim.id} className="rounded-xl border border-background-secondary bg-background p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy-900">{claim.requestedSchoolName}</p>
                  <p className="text-xs text-slate-500">{claim.requestedArea}</p>
                </div>
                <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase text-amber-700">{claim.status}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <p>Official email: {claim.officialEmail}</p>
                <p>Official phone: {claim.officialPhone}</p>
                <p>Proof file: {claim.proofFileName}</p>
                <p>Submitted: {claim.createdAt.toISOString().slice(0, 10)}</p>
              </div>
              {claim.adminNote ? <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-600">Admin note: {claim.adminNote}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
