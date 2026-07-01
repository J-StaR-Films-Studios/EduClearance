'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const autoConfirmReference = useRef<string | null>(null);

  const paymentReference = searchParams.get('payment_reference');
  const numericAmount = Number(amount);
  const trimmedBillingEmail = billingEmail.trim();
  const hasValidBillingEmail = emailPattern.test(trimmedBillingEmail);
  const canOpenCheckout = !isInitializing && Number.isFinite(numericAmount) && numericAmount > 0 && hasValidBillingEmail;
  const formattedAmount = useMemo(() => formatTopUpAmount(Number.isFinite(numericAmount) ? numericAmount : 0), [numericAmount]);

  async function initializeTopUp() {
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid deposit amount.');
      return;
    }

    if (!hasValidBillingEmail) {
      setErrorMessage('Enter a valid billing email before checkout.');
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

  const verifyPayment = useCallback(
    async ({ automatic = false }: { automatic?: boolean } = {}) => {
      if (!paymentReference) {
        return { ok: false, retryable: false };
      }

      setErrorMessage('');
      setStatusMessage(automatic ? 'Checking your payment automatically…' : 'Checking your payment…');
      setIsVerifying(true);

      try {
        const response = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: paymentReference }),
        });
        const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; credited?: boolean; retryable?: boolean } | null;

        if (!response.ok || !result?.ok) {
          setStatusMessage('');
          setErrorMessage(result?.message ?? 'We could not confirm this payment yet. If you completed checkout, wait a moment and try again.');
          return { ok: false, retryable: result?.retryable !== false };
        }

        setErrorMessage('');
        setStatusMessage(result.credited ? 'Payment confirmed. Your wallet balance has been updated.' : 'This payment has already been added to your wallet.');
        router.refresh();
        return { ok: true, retryable: false };
      } catch {
        setStatusMessage('');
        setErrorMessage('We could not confirm this payment yet. If you completed checkout, wait a moment and try again.');
        return { ok: false, retryable: true };
      } finally {
        setIsVerifying(false);
      }
    },
    [paymentReference, router],
  );

  useEffect(() => {
    if (!paymentReference || autoConfirmReference.current === paymentReference) {
      return;
    }

    autoConfirmReference.current = paymentReference;
    let cancelled = false;
    const retryDelaysMs = [0, 3000, 7000, 12000];

    async function autoConfirmPayment() {
      for (const delayMs of retryDelaysMs) {
        if (cancelled) {
          return;
        }

        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        if (cancelled) {
          return;
        }

        const result = await verifyPayment({ automatic: true });

        if (result.ok || !result.retryable) {
          return;
        }
      }
    }

    void autoConfirmPayment();

    return () => {
      cancelled = true;
    };
  }, [paymentReference, verifyPayment]);

  return (
    <>
      {paymentReference ? (
        <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs leading-relaxed text-emerald-900">
          <p className="break-words">Welcome back. We are checking your payment automatically. If it does not update after a moment, you can try again.</p>
          <button
            type="button"
            onClick={() => void verifyPayment()}
            disabled={isVerifying}
            className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isVerifying ? 'Checking…' : 'Try again'}
          </button>
        </div>
      ) : null}

      <div className="space-y-5 rounded-2xl border border-background-secondary bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-navy-900">Purchase Clearance Credits</h3>
          <p className="text-[10px] leading-relaxed text-slate-500 break-words">
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
                'rounded-lg border py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-navy-800 focus:ring-offset-2',
                amount === String(quickAmount)
                  ? 'border-navy-900 bg-navy-50 text-navy-900 shadow-sm'
                  : 'border-background-secondary bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(quickAmount)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[150px_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
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
          <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Billing email for receipt
            <input
              type="email"
              inputMode="email"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
              placeholder="accounts@school.com"
              required
              aria-invalid={billingEmail.length > 0 && !hasValidBillingEmail}
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs font-normal normal-case tracking-normal text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-800"
            />
          </label>
          <button
            type="button"
            onClick={initializeTopUp}
            disabled={!canOpenCheckout}
            title={!hasValidBillingEmail ? 'Enter a valid billing email before checkout.' : undefined}
            className="w-full sm:col-span-2 lg:col-span-1 rounded-lg bg-navy-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap shadow-sm min-h-[38px] flex items-center justify-center"
          >
            {isInitializing ? 'Opening checkout…' : 'Continue to secure checkout'}
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          {!hasValidBillingEmail ? <p className="text-xs font-medium text-slate-500">Enter a billing email to continue to checkout.</p> : null}
          {errorMessage ? <p className="text-xs font-medium text-terracotta-700 break-words">{errorMessage}</p> : null}
          {statusMessage ? <p className="text-xs font-medium text-emerald-700 break-words">{statusMessage}</p> : null}

          <p className="text-[10px] leading-relaxed text-slate-500 break-words">
            Selected amount: <strong>{formattedAmount}</strong>. Your wallet balance updates once payment is confirmed.
          </p>
        </div>
      </div>
    </>
  );
}
