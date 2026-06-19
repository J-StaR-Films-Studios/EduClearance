'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { type SchoolUserRole, withRoleQuery } from '@/lib/local-school-data';
import { cn } from '@/lib/utils';

const quickAmounts = [5000, 10000, 20000] as const;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [billingEmail, setBillingEmail] = useState('');
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

    const trimmedBillingEmail = billingEmail.trim();

    if (trimmedBillingEmail && !emailPattern.test(trimmedBillingEmail)) {
      setErrorMessage('Please enter a valid billing email or leave it blank.');
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
          ...(trimmedBillingEmail ? { email: trimmedBillingEmail } : {}),
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; authorizationUrl?: string } | null;

      if (!response.ok || !result?.ok || !result.authorizationUrl) {
        setErrorMessage(result?.message ?? 'Unable to start checkout. Please try again.');
        return;
      }

      window.location.assign(result.authorizationUrl);
    } catch {
      setErrorMessage('Unable to start checkout. Please try again.');
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
        setErrorMessage(result?.message ?? 'We could not confirm this payment yet. If you completed checkout, wait a moment and try again.');
        return;
      }

      setStatusMessage(result.credited ? 'Payment confirmed. Your wallet balance has been updated.' : 'This payment has already been added to your wallet.');
      router.refresh();
    } catch {
      setErrorMessage('We could not confirm this payment yet. If you completed checkout, wait a moment and try again.');
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <>
      {paymentReference ? (
        <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-900">
          <p>Welcome back. If your payment was completed, confirm it now and your wallet balance will update automatically.</p>
          <button
            type="button"
            onClick={verifyPayment}
            disabled={isVerifying}
            className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isVerifying ? 'Confirming…' : 'Confirm payment'}
          </button>
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm md:col-span-2">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-navy-900">Purchase Clearance Credits</h3>
          <p className="text-[10px] leading-relaxed text-slate-500">
            Choose an amount and continue to secure checkout. Your balance updates after payment confirmation.
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Amount
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter custom amount"
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs font-normal normal-case tracking-normal text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-800"
            />
          </label>
          <label className="space-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Billing email for receipt
            <input
              type="email"
              inputMode="email"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
              placeholder="accounts@school.com"
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs font-normal normal-case tracking-normal text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-800"
            />
          </label>
          <button
            type="button"
            onClick={initializeTopUp}
            disabled={isInitializing}
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isInitializing ? 'Opening checkout…' : 'Continue to secure checkout'}
          </button>
        </div>

        {errorMessage ? <p className="text-xs font-medium text-terracotta-700">{errorMessage}</p> : null}
        {statusMessage ? <p className="text-xs font-medium text-emerald-700">{statusMessage}</p> : null}

        <p className="text-[10px] leading-relaxed text-slate-500">
          Selected amount: <strong>{formattedAmount}</strong>. Your wallet balance updates once payment is confirmed.
        </p>
      </div>
    </>
  );
}
