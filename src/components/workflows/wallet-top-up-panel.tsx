'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { type SchoolUserRole, withRoleQuery } from '@/lib/local-school-data';
import { cn } from '@/lib/utils';

const quickAmounts = [5000, 10000, 20000] as const;

function formatTopUpAmount(amountNaira: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountNaira);
}

export function WalletTopUpPanel({ role }: { role: SchoolUserRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('5000');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const paymentReference = searchParams.get('payment_reference');
  const numericAmount = Number(amount);
  const formattedAmount = useMemo(() => formatTopUpAmount(Number.isFinite(numericAmount) ? numericAmount : 0), [numericAmount]);

  async function initializeTopUp() {
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid deposit amount.');
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setIsInitializing(true);

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountKobo: Math.round(numericAmount * 100),
          callbackUrl: `${window.location.origin}${withRoleQuery('/wallet', role)}`,
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; authorizationUrl?: string } | null;

      if (!response.ok || !result?.ok || !result.authorizationUrl) {
        setErrorMessage(result?.message ?? 'Unable to initialize payment. Please try again.');
        return;
      }

      window.location.assign(result.authorizationUrl);
    } catch {
      setErrorMessage('Unable to initialize payment. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  }

  async function verifyPayment() {
    if (!paymentReference) {
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: paymentReference }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; credited?: boolean } | null;

      if (!response.ok || !result?.ok) {
        setErrorMessage(result?.message ?? 'Unable to verify payment. Please try again.');
        return;
      }

      setStatusMessage(result.credited ? 'Payment verified and wallet credit posted.' : 'Payment was already verified for this wallet.');
      router.refresh();
    } catch {
      setErrorMessage('Unable to verify payment. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <>
      {paymentReference ? (
        <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          <p>
            Payment callback received with reference <strong>{paymentReference}</strong>. Wallet credit posts after server-side verification records the transaction.
          </p>
          <button
            type="button"
            onClick={verifyPayment}
            disabled={isVerifying}
            className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isVerifying ? 'Verifying…' : 'Verify payment'}
          </button>
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm md:col-span-2">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-navy-900">Purchase Clearance Credits</h3>
          <p className="text-[10px] leading-relaxed text-slate-500">
            Checkout creates a pending payment reference first. Wallet credit posts only after server verification succeeds.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => setAmount(String(quickAmount))}
              className={cn(
                'rounded-lg border border-background-secondary py-2.5 text-xs font-semibold transition hover:bg-background-secondary',
                amount === String(quickAmount) ? 'bg-background text-navy-900' : 'bg-white text-slate-600',
              )}
            >
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(quickAmount)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter custom amount"
            className="flex-1 rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <button
            type="button"
            onClick={initializeTopUp}
            disabled={isInitializing}
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isInitializing ? 'Initializing…' : 'Continue to Paystack'}
          </button>
        </div>

        {errorMessage ? <p className="text-xs font-medium text-terracotta-700">{errorMessage}</p> : null}
        {statusMessage ? <p className="text-xs font-medium text-emerald-700">{statusMessage}</p> : null}

        <p className="text-[10px] leading-relaxed text-slate-500">
          Selected amount: <strong>{formattedAmount}</strong>. A successful browser return never credits the wallet by itself.
        </p>
      </div>
    </>
  );
}
