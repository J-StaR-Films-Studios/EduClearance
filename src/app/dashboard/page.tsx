import Link from 'next/link';
import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { APP_NAME } from '@/lib/site';
import { db } from '@/db/client';
import { clearanceRequests, schools } from '@/db/schema';
import {
  buildWhatsAppHref,
  withRoleQuery,
} from '@/lib/local-school-data';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { formatChecksFromKobo, formatNairaFromKobo } from '@/lib/money';
import { requireSchoolSession } from '@/lib/require-school-session';
import { noIndexMetadata } from '@/lib/seo';
import { getSchoolWalletBalanceKobo } from '@/lib/school-wallet';
import { cn } from '@/lib/utils';

export const metadata: Metadata = noIndexMetadata(`Dashboard | ${APP_NAME}`, 'Private school dashboard for EduClearance workflows.');

export default async function DashboardPage() {
  const currentRole = await requireSchoolSession('/dashboard');
  const actor = await resolveLocalSchoolActor();
  const [walletBalanceKobo, recentClearances, inboundClearances] = actor
    ? await Promise.all([
        getSchoolWalletBalanceKobo(actor.schoolId),
        db
          .select({
            id: clearanceRequests.id,
            studentName: clearanceRequests.studentName,
            previousSchoolName: clearanceRequests.previousSchoolNameSnapshot,
            createdAt: clearanceRequests.createdAt,
            searchResult: clearanceRequests.searchResult,
          })
          .from(clearanceRequests)
          .where(eq(clearanceRequests.incomingSchoolId, actor.schoolId))
          .orderBy(desc(clearanceRequests.createdAt))
          .limit(10),
        db
          .select({
            id: clearanceRequests.id,
            studentName: clearanceRequests.studentName,
            requestingSchool: schools.name,
            requestingSchoolPhone: schools.clearancePhone,
            requestingSchoolMainPhone: schools.mainPhone,
            requestingSchoolWhatsappPhone: schools.whatsappPhone,
            requestingSchoolEmail: schools.contactEmail,
            status: clearanceRequests.status,
            searchResult: clearanceRequests.searchResult,
          })
          .from(clearanceRequests)
          .innerJoin(schools, eq(schools.id, clearanceRequests.incomingSchoolId))
          .where(eq(clearanceRequests.previousSchoolId, actor.schoolId))
          .orderBy(desc(clearanceRequests.createdAt))
          .limit(10),
      ])
    : [0, [], []];
  const pendingInboundClearance = inboundClearances.find((request) => !['cleared_by_previous_school', 'closed'].includes(request.status));
  const pendingInboundIsPotential = pendingInboundClearance?.searchResult === 'possible_match';
  const pendingInboundRequestPhone = pendingInboundClearance?.requestingSchoolPhone ?? pendingInboundClearance?.requestingSchoolMainPhone ?? null;
  const pendingInboundWhatsappPhone = pendingInboundClearance?.requestingSchoolWhatsappPhone ?? pendingInboundRequestPhone;
  const pendingInboundWhatsappHref = pendingInboundClearance && pendingInboundWhatsappPhone
    ? buildWhatsAppHref(pendingInboundWhatsappPhone, `Hello ${pendingInboundClearance.requestingSchool}, we are reviewing your EduClearance request because it only looks like a possible match. Please help confirm the parent details before we treat it as a confirmed record.`)
    : undefined;
  const schoolName = actor?.schoolName ?? 'School Dashboard';

  return (
    <SchoolAppShell activeKey="dashboard" role={currentRole}>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col items-start justify-between gap-4 border-b border-background-secondary pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{schoolName}</h1>
            <p className="text-xs text-slate-500">Private dashboard for verified school clearance workflows.</p>
          </div>

          {currentRole === 'school_staff' ? (
            <div className="rounded-xl border border-background-secondary bg-white p-3 text-xs text-slate-500 shadow-sm">
              Wallet top-ups are available to school owners or admins only.
            </div>
          ) : (
            <Link
              href={withRoleQuery('/wallet', currentRole)}
              className="flex items-center gap-3 rounded-xl border border-background-secondary bg-white p-3 shadow-sm transition hover:bg-background-secondary"
            >
              <div className="rounded-lg bg-navy-50 p-2 text-navy-900">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Wallet Balance</p>
                <p className="text-sm font-semibold text-navy-900">
                  {formatNairaFromKobo(walletBalanceKobo)}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({formatChecksFromKobo(walletBalanceKobo)} checks left)
                  </span>
                </p>
              </div>
            </Link>
          )}
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-background-secondary bg-white p-4 sm:p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-navy-900">Incoming Student Verification</h2>
              <p className="mt-1 text-sm text-slate-600">
                Initiate a transfer clearance request before completing student enrollment. Costs ₦100.
              </p>
            </div>
            <Link
              href={withRoleQuery('/clearance/new', currentRole)}
              className="flex items-center justify-center gap-2 rounded-lg bg-navy-900 py-3 text-center text-sm font-medium text-white transition hover:bg-navy-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Start Clearance Request
            </Link>
          </div>

          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-background-secondary bg-white p-4 sm:p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-navy-900">Report Unresolved Issue</h2>
              <p className="mt-1 text-sm text-slate-600">
                Submit departures with outstanding school fees, books, or uniform balances to the cluster index for free.
              </p>
            </div>
            <Link
              href={withRoleQuery('/issues/new', currentRole)}
              className="flex items-center justify-center gap-2 rounded-lg border border-background-secondary bg-white py-3 text-center text-sm font-medium text-navy-900 transition hover:bg-background-secondary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report Unresolved Issue (Free)
            </Link>
          </div>
        </div>

        {pendingInboundClearance ? (
          <div className={cn('space-y-2 rounded-xl border p-4 text-sm leading-relaxed', pendingInboundIsPotential ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-terracotta-200 bg-terracotta-50 text-terracotta-900')}>
            <div className="flex items-center gap-2 font-bold">
              <svg className={cn('h-4 w-4', pendingInboundIsPotential ? 'text-amber-600' : 'text-terracotta-600')} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {pendingInboundIsPotential ? 'Potential Clearance Match Needs Review' : 'Confirmed Clearance Response Required'}
            </div>
            {pendingInboundIsPotential ? (
              <div className="space-y-2 text-xs">
                <p>
                  <strong>{pendingInboundClearance.requestingSchool}</strong> opened a clearance check that looks similar to a record associated with your school. This is a fuzzy match, not a confirmed student obligation, so review privately before responding.
                </p>
                <div className="rounded-lg border border-amber-200 bg-white/70 p-3 text-xs">
                  <p className="font-semibold text-amber-950 mb-2">Contact the school that filed this request</p>
                  <div className="space-y-2">
                    <p className="font-medium text-amber-900">{pendingInboundClearance.requestingSchool}</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1 text-[11px]">
                      {pendingInboundRequestPhone && (
                        <div className="flex items-center gap-1.5 text-amber-800">
                          <svg className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{pendingInboundRequestPhone}</span>
                        </div>
                      )}
                      {pendingInboundClearance.requestingSchoolWhatsappPhone && (
                        <div className="flex items-center gap-1.5 text-amber-800">
                          <svg className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>WhatsApp: {pendingInboundClearance.requestingSchoolWhatsappPhone}</span>
                        </div>
                      )}
                      {pendingInboundClearance.requestingSchoolEmail && (
                        <div className="flex items-center gap-1.5 text-amber-800">
                          <svg className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{pendingInboundClearance.requestingSchoolEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs">
                <strong>{pendingInboundClearance.requestingSchool}</strong> has opened a confirmed clearance verification check involving your school. Please verify or update the clearance status.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Link
                href={withRoleQuery('/clearance?tab=inbound', currentRole)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition', pendingInboundIsPotential ? 'bg-amber-600 hover:bg-amber-700' : 'bg-terracotta-600 hover:bg-terracotta-700')}
              >
                {pendingInboundIsPotential ? 'Review Potential Match' : 'Review Inbound Request'}
              </Link>
              {pendingInboundIsPotential && pendingInboundRequestPhone ? (
                <a
                  href={`tel:${pendingInboundRequestPhone.replace(/\s+/g, '')}`}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
                >
                  Call Requesting School
                </a>
              ) : null}
              {pendingInboundIsPotential && pendingInboundWhatsappHref ? (
                <a
                  href={pendingInboundWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
                >
                  WhatsApp Requesting School
                </a>
              ) : null}
              {!pendingInboundIsPotential ? (
                <Link
                  href={withRoleQuery('/issues/new?source=inbound', currentRole)}
                  className="rounded-lg border border-terracotta-300 bg-white px-3 py-1.5 text-xs font-semibold text-terracotta-900 transition hover:bg-terracotta-50"
                >
                  Report Owed Balance
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-background-secondary bg-white shadow-sm">
          <div className="border-b border-background-secondary p-6">
            <h3 className="text-lg font-bold text-navy-900">Recent Student Checks Initiated By You</h3>
          </div>
          <div className="overflow-x-auto whitespace-nowrap">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-background-secondary bg-background text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 sm:px-6 py-3">Student Name</th>
                  <th className="px-3 sm:px-6 py-3">Previous School</th>
                  <th className="px-3 sm:px-6 py-3">Date Checked</th>
                  <th className="px-3 sm:px-6 py-3">System Match Status</th>
                  <th className="px-3 sm:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-secondary">
                {recentClearances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-sm text-slate-500">
                      No clearance checks have been started yet.
                    </td>
                  </tr>
                ) : recentClearances.map((clearance) => (
                  <tr key={clearance.id}>
                    <td className="px-3 sm:px-6 py-3.5 sm:py-4 font-semibold text-navy-900">{clearance.studentName}</td>
                    <td className="px-3 sm:px-6 py-3.5 sm:py-4 text-slate-600">{clearance.previousSchoolName}</td>
                    <td className="px-3 sm:px-6 py-3.5 sm:py-4 text-slate-500">{clearance.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-3 sm:px-6 py-3.5 sm:py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border border-background-secondary border-l-4 bg-white py-1 pl-2.5 pr-3.5 text-[10px] font-bold uppercase tracking-wider text-navy-900 shadow-sm',
                          clearance.searchResult === 'confirmed_match' ? 'border-l-terracotta-600' : clearance.searchResult === 'possible_match' ? 'border-l-amber-600' : 'border-l-emerald-600',
                        )}
                      >
                        {clearance.searchResult === 'confirmed_match' ? 'Owed Balance' : clearance.searchResult === 'possible_match' ? 'Review Needed' : 'No Record'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3.5 sm:py-4 text-right">
                      <Link
                        href={withRoleQuery(`/clearance/${clearance.id}`, currentRole)}
                        className="text-xs font-semibold text-navy-900 hover:underline"
                      >
                        {clearance.searchResult === 'confirmed_match' ? 'Review Issue' : 'View Details'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SchoolAppShell>
  );
}
