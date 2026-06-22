import Link from 'next/link';
import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { APP_NAME } from '@/lib/site';
import { db } from '@/db/client';
import { clearanceRequests, schools } from '@/db/schema';
import {
  schoolProfile,
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
            status: clearanceRequests.status,
          })
          .from(clearanceRequests)
          .innerJoin(schools, eq(schools.id, clearanceRequests.incomingSchoolId))
          .where(eq(clearanceRequests.previousSchoolId, actor.schoolId))
          .orderBy(desc(clearanceRequests.createdAt))
          .limit(10),
      ])
    : [0, [], []];
  const pendingInboundClearance = inboundClearances.find((request) => !['cleared_by_previous_school', 'closed'].includes(request.status));
  const schoolName = actor?.schoolName ?? 'School Dashboard';

  return (
    <SchoolAppShell activeKey="dashboard" role={currentRole}>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col items-start justify-between gap-4 border-b border-background-secondary pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{schoolName}</h1>
            <p className="text-xs text-slate-500">Cluster: {schoolProfile.cluster}</p>
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
          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
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

          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
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
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Pending Clearance Response Required
            </div>
            <p className="text-xs">
              <strong>{pendingInboundClearance.requestingSchool}</strong> has opened a clearance verification check for <strong>{pendingInboundClearance.studentName}</strong>,
              who registered your school as their previous attending school. Please verify or update their clearance status.
            </p>
            <div className="flex gap-2">
              <Link
                href={withRoleQuery('/clearance?tab=inbound', currentRole)}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
              >
                Review Inbound Request
              </Link>
              <Link
                href={withRoleQuery('/issues/new?source=inbound', currentRole)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
              >
                Report Owed Balance
              </Link>
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
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Previous School</th>
                  <th className="px-6 py-3">Date Checked</th>
                  <th className="px-6 py-3">System Match Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-secondary">
                {recentClearances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      No clearance checks have been started yet.
                    </td>
                  </tr>
                ) : recentClearances.map((clearance) => (
                  <tr key={clearance.id}>
                    <td className="px-6 py-4 font-semibold text-navy-900">{clearance.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{clearance.previousSchoolName}</td>
                    <td className="px-6 py-4 text-slate-500">{clearance.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border border-background-secondary border-l-4 bg-white py-1 pl-2.5 pr-3.5 text-[10px] font-bold uppercase tracking-wider text-navy-900 shadow-sm',
                          clearance.searchResult === 'confirmed_match' ? 'border-l-terracotta-600' : clearance.searchResult === 'possible_match' ? 'border-l-amber-600' : 'border-l-emerald-600',
                        )}
                      >
                        {clearance.searchResult === 'confirmed_match' ? 'Owed Balance' : clearance.searchResult === 'possible_match' ? 'Review Needed' : 'No Record'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
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
