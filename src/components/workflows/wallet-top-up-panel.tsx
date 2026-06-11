'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { type DemoUserRole, withRoleQuery } from '@/lib/demo-school-data';
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

export function WalletTopUpPanel({ role }: { role: DemoUserRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('5000');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const paymentReference = searchParams.get('payment_reference');
  const numericAmount = Number(amount);
  const modalAmount = useMemo(() => formatTopUpAmount(Number.isFinite(numericAmount) ? numericAmount : 0), [numericAmount]);

  function openPaystackModal() {
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid deposit amount.');
      return;
    }

    setErrorMessage('');
    setIsModalOpen(true);
  }

  function confirmMockPayment() {
    setIsModalOpen(false);
    router.replace(withRoleQuery('/wallet?payment_reference=mock_pending_verification', role));
  }

  return (
    <>
      {paymentReference ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          Mock payment callback received with reference <strong>{paymentReference}</strong>. The wallet balance above has <strong>not</strong>{' '}
          been credited from the client callback. Server-side Paystack verification is required before any wallet credit is posted.
        </div>
      ) : null}

      <div className="bg-white p-6 rounded-2xl border border-background-secondary shadow-sm md:col-span-2 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-navy-900">Purchase Clearance Credits</h3>
          <p className="text-[10px] leading-relaxed text-slate-500">Prototype mode only. This panel does not post a real wallet credit.</p>
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
            onClick={openPaystackModal}
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800"
          >
            Open Paystack Demo
          </button>
        </div>

        {errorMessage ? <p className="text-xs font-medium text-terracotta-700">{errorMessage}</p> : null}

        <p className="text-[10px] leading-relaxed text-slate-500">
          Card or transfer checkout can be initialized from the server. A successful client callback never credits the wallet by itself.
        </p>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-background-secondary pb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Paystack Gateway Demo</span>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-navy-900">
                ✕
              </button>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs text-slate-500">Securing payment transaction for Grace Academy</p>
              <p className="font-display text-2xl font-bold text-navy-900">{modalAmount}</p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={confirmMockPayment}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-xs font-medium text-white transition hover:bg-emerald-700"
              >
                Simulate Successful Callback
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-lg border border-background-secondary bg-background py-3 text-xs font-medium text-slate-600 transition hover:bg-background-secondary"
              >
                Simulate Cancel/Decline
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400">
              Wallet credits remain pending until the server verifies the Paystack reference and records the transaction once only.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
