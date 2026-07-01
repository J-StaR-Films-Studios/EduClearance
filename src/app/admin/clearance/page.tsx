import type { Metadata } from 'next';

import { desc, eq } from 'drizzle-orm';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminClearanceWorkspace } from '@/components/admin/admin-clearance-workspace';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import { db } from '@/db/client';
import { clearanceIssues, clearanceRequests, schools, wallets } from '@/db/schema';
import { isPlatformAdminSession } from '@/lib/local-session';
import { formatNairaFromKobo } from '@/lib/money';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(`Global Clearances | ${APP_NAME}`, 'Private admin clearance and wallet controls page.');

function mapClearanceStatus(searchResult: string, status: string) {
  if (status === 'disputed') {
    return 'disputed' as const;
  }

  if (status === 'no_response') {
    return 'no_response' as const;
  }

  if (searchResult === 'confirmed_match') {
    return 'owed_balance' as const;
  }

  return 'no_record' as const;
}

export default async function AdminClearancePage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  const [walletRows, clearanceRows, issueRows] = await Promise.all([
    db
      .select({ id: schools.id, schoolName: schools.name, balanceKobo: wallets.balanceKobo, status: schools.status })
      .from(schools)
      .leftJoin(wallets, eq(wallets.schoolId, schools.id)),
    db.select().from(clearanceRequests).orderBy(desc(clearanceRequests.createdAt)).limit(100),
    db.select().from(clearanceIssues).orderBy(desc(clearanceIssues.createdAt)).limit(10),
  ]);

  const walletWatch = walletRows.map((school) => ({
    id: school.id,
    schoolName: school.schoolName,
    balanceLabel: formatNairaFromKobo(school.balanceKobo ?? 0),
    hint: `Status: ${school.status}`,
  }));

  const clearanceRecords = await Promise.all(
    clearanceRows.map(async (request) => {
      const [incomingSchool] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, request.incomingSchoolId)).limit(1);

      return {
        id: request.id,
        studentName: request.studentName,
        admittingSchool: incomingSchool?.name ?? 'Admitting school',
        previousSchool: request.previousSchoolNameSnapshot,
        status: mapClearanceStatus(request.searchResult, request.status),
        issueCount: request.searchResult === 'confirmed_match' ? 1 : 0,
        chargedNaira: request.amountCharged / 100,
        checkedAt: request.createdAt.toISOString().slice(0, 10),
      };
    }),
  );

  const issueSummaries = await Promise.all(
    issueRows.map(async (issue) => {
      const [reportingSchool] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, issue.reportingSchoolId)).limit(1);

      return {
        id: issue.id,
        studentName: issue.studentName,
        reportingSchool: reportingSchool?.name ?? 'Reporting school',
        amountLabel: formatNairaFromKobo(issue.amountOwed),
        status: issue.status === 'resolved' ? 'resolved' as const : issue.status === 'disputed' ? 'disputed' as const : 'unresolved' as const,
        updatedAt: issue.createdAt.toISOString().slice(0, 10),
      };
    }),
  );

  return (
    <AdminAppShell activeKey="clearance">
      <header className="flex flex-col gap-1 border-b border-background-secondary pb-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900">Platform Clearances &amp; Wallet Controls</h1>
          <p className="text-xs text-slate-500">Track clearance requests and adjust school wallet balances</p>
        </div>
      </header>

      <AdminClearanceWorkspace initialClearanceRecords={clearanceRecords} initialIssueSummaries={issueSummaries} initialWalletWatchSchools={walletWatch} />
    </AdminAppShell>
  );
}
