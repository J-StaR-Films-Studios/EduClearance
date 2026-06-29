import type { Metadata } from 'next';
import Link from 'next/link';

import { asc } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { ClearanceRequestForm } from '@/components/workflows/clearance-request-form';
import { db } from '@/db/client';
import { schools } from '@/db/schema';
import { withRoleQuery } from '@/lib/local-school-data';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { requireSchoolSession } from '@/lib/require-school-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';
import { getSchoolWalletBalanceKobo } from '@/lib/school-wallet';

export const metadata: Metadata = noIndexMetadata(`Start Clearance Request | ${APP_NAME}`, 'Private transfer clearance form.');

export default async function ClearanceNewPage() {
  const currentRole = await requireSchoolSession('/clearance/new');
  const actor = await resolveLocalSchoolActor();
  const walletBalanceKobo = actor ? await getSchoolWalletBalanceKobo(actor.schoolId) : 0;
  const directorySchools = await db
    .select({
      id: schools.id,
      name: schools.name,
      area: schools.area,
      address: schools.address,
      status: schools.status,
    })
    .from(schools)
    .orderBy(asc(schools.name))
    .limit(500);

  return (
    <SchoolAppShell activeKey="clearance-new" role={currentRole}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="flex items-center justify-between border-b border-background-secondary pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Start Clearance Request</h1>
            <p className="text-xs text-slate-500">Initiate a transfer verification for an incoming student</p>
          </div>
          <Link href={withRoleQuery('/dashboard', currentRole)} className="text-xs text-slate-500 hover:text-navy-900">
            ← Back
          </Link>
        </header>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          Clearance requests create the request row and apply the ₦100 wallet debit together on the server using provisioned school data.
        </div>

        <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8">
          <ClearanceRequestForm role={currentRole} walletBalanceKobo={walletBalanceKobo} schools={directorySchools} />
        </div>
      </div>
    </SchoolAppShell>
  );
}
