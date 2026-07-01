import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';

import { SchoolAppShell } from '@/components/app/school-app-shell';
import { WalletTopUpPanel } from '@/components/workflows/wallet-top-up-panel';
import { db } from '@/db/client';
import { walletTransactions, wallets } from '@/db/schema';
import { type WalletTransactionView, withRoleQuery } from '@/lib/local-school-data';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { formatChecksFromKobo, formatNairaFromKobo } from '@/lib/money';
import { requireSchoolSession } from '@/lib/require-school-session';
import { noIndexMetadata } from '@/lib/seo';
import { APP_NAME } from '@/lib/site';
import { cn } from '@/lib/utils';

export const metadata: Metadata = noIndexMetadata(`Wallet & Billing | ${APP_NAME}`, 'Private wallet and billing page.');

function formatTransactionAmount(amountKobo: number) {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amountKobo) / 100);
}

function formatReceiptId(reference: string) {
  return reference.replace(/^paystack-credit:/i, 'topup-').replace(/^pstk_/i, 'topup_');
}

function formatTransactionDescription(description: string) {
  return description.replace(/Paystack wallet top-up/gi, 'Wallet top-up').replace(/Paystack Wallet Deposit/gi, 'Wallet top-up');
}

async function getWalletViewData(): Promise<{ balanceKobo: number; transactions: WalletTransactionView[] }> {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return { balanceKobo: 0, transactions: [] };
  }

  const [[wallet], transactionRows] = await Promise.all([
    db.select({ balanceKobo: wallets.balanceKobo }).from(wallets).where(eq(wallets.schoolId, actor.schoolId)).limit(1),
    db
      .select({
        id: walletTransactions.id,
        createdAt: walletTransactions.createdAt,
        reference: walletTransactions.reference,
        type: walletTransactions.type,
        description: walletTransactions.description,
        amountKobo: walletTransactions.amountKobo,
      })
      .from(walletTransactions)
      .where(eq(walletTransactions.schoolId, actor.schoolId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(20),
  ]);

  return {
    balanceKobo: wallet?.balanceKobo ?? 0,
    transactions: transactionRows.map((transaction) => ({
      id: transaction.id,
      createdAt: transaction.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      reference: formatReceiptId(transaction.reference),
      type: transaction.type === 'adjustment' ? 'refund' : transaction.type,
      description: formatTransactionDescription(transaction.description),
      amountKobo: transaction.type === 'debit' ? -transaction.amountKobo : transaction.amountKobo,
      statusLabel: transaction.type === 'credit' ? 'Credit' : transaction.type === 'refund' ? 'Refund' : transaction.type === 'adjustment' ? 'Adjustment' : 'Debit',
    })),
  };
}

export default async function WalletPage() {
  const currentRole = await requireSchoolSession('/wallet');
  const isStaff = currentRole === 'school_staff';
  const walletViewData = await getWalletViewData();

  return (
    <SchoolAppShell activeKey="wallet" mobileMode="history" role={currentRole}>
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-0 py-2 sm:py-4 space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-background-secondary pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Wallet &amp; Top Up</h1>
            <p className="text-xs text-slate-500">Manage school clearance credits and billing</p>
          </div>
          <Link
            href={withRoleQuery('/dashboard', currentRole)}
            className="text-xs font-semibold text-slate-500 hover:text-navy-900 transition self-start sm:self-auto"
          >
            ← Back to Dashboard
          </Link>
        </header>

        {isStaff ? (
          <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-4 sm:p-6 shadow-sm">
            <div className="rounded-xl bg-navy-900 p-5 sm:p-6 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Clearance Balance</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight break-all">{formatNairaFromKobo(walletViewData.balanceKobo)}</p>
              <p className="mt-2 text-xs text-navy-200">
                Equals {formatChecksFromKobo(walletViewData.balanceKobo)} remaining student checks
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs sm:text-sm leading-relaxed text-amber-900">
              Wallet billing is limited for staff accounts. Please contact your school proprietor or admin to top up or review billing history.
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
              <div className="flex min-h-[160px] flex-col justify-between rounded-2xl border border-navy-800 bg-navy-900 p-5 sm:p-6 text-white shadow-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Clearance Balance</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight break-all">{formatNairaFromKobo(walletViewData.balanceKobo)}</p>
                </div>
                <p className="mt-4 text-xs text-navy-200">
                  Equals {formatChecksFromKobo(walletViewData.balanceKobo)} remaining student checks
                </p>
              </div>

              <WalletTopUpPanel role={currentRole} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-background-secondary bg-white shadow-sm">
              <div className="border-b border-background-secondary p-4 sm:p-6">
                <h3 className="text-sm font-bold text-navy-900">Transaction History Log</h3>
              </div>

              {/* Mobile View: Transaction List */}
              <div className="block sm:hidden divide-y divide-background-secondary">
                {walletViewData.transactions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No transactions found.
                  </div>
                ) : (
                  walletViewData.transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">{transaction.createdAt}</span>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[9px] font-semibold',
                            transaction.type === 'credit'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : transaction.type === 'refund'
                                ? 'border-amber-100 bg-amber-50 text-amber-700'
                                : 'border-background-secondary bg-background text-slate-700',
                          )}
                        >
                          {transaction.statusLabel}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className={cn('text-xs text-slate-700 break-words leading-normal', transaction.type === 'credit' ? 'font-semibold text-navy-900' : 'font-medium')}>
                            {transaction.description}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 break-all leading-none">
                            {transaction.reference}
                          </p>
                        </div>
                        <div className={cn('text-right text-xs font-bold whitespace-nowrap', transaction.amountKobo >= 0 ? 'text-emerald-600' : 'text-navy-900')}>
                          {transaction.amountKobo >= 0 ? '+' : '-'}{formatTransactionAmount(transaction.amountKobo)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Transaction Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 font-mono">Receipt ID</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-secondary text-slate-600">
                    {walletViewData.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{transaction.createdAt}</td>
                        <td className="px-6 py-4 font-mono whitespace-nowrap">{transaction.reference}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 font-semibold',
                              transaction.type === 'credit'
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                : transaction.type === 'refund'
                                  ? 'border-amber-100 bg-amber-50 text-amber-700'
                                  : 'border-background-secondary bg-background text-slate-700',
                            )}
                          >
                            {transaction.statusLabel}
                          </span>
                        </td>
                        <td className={cn('px-6 py-4 whitespace-normal break-words max-w-xs', transaction.type === 'credit' ? 'font-medium text-navy-900' : '')}>
                          {transaction.description}
                        </td>
                        <td className={cn('px-6 py-4 text-right font-semibold whitespace-nowrap', transaction.amountKobo >= 0 ? 'text-emerald-600' : 'text-navy-900')}>
                          {transaction.amountKobo >= 0 ? '+' : '-'}{formatTransactionAmount(transaction.amountKobo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </SchoolAppShell>
  );
}
