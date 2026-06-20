'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  getPreviousSchoolSelection,
  previousSchoolOptions,
  type SchoolUserRole,
  withRoleQuery,
} from '@/lib/local-school-data';
import { CHECK_PRICE_KOBO, formatChecksFromKobo, formatNairaFromKobo } from '@/lib/money';

type ClearanceRequestFormProps = {
  role: SchoolUserRole;
  walletBalanceKobo: number;
};

export function ClearanceRequestForm({ role, walletBalanceKobo }: ClearanceRequestFormProps) {
  const router = useRouter();
  const [selectedSchool, setSelectedSchool] = useState<string>(previousSchoolOptions[0].value);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingBalanceKobo = useMemo(() => Math.max(walletBalanceKobo - CHECK_PRICE_KOBO, 0), [walletBalanceKobo]);

  async function handleSubmit() {
    const form = document.getElementById('clearance-request-form');
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    setErrorMessage('');

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const studentName = String(formData.get('studentName') ?? '').trim();
    const parentName = String(formData.get('parentName') ?? '').trim();
    const parentPhone = String(formData.get('parentPhone') ?? '').trim();
    const previousSchoolValue = String(formData.get('previousSchool') ?? '');
    const manualSchoolName = String(formData.get('manualSchoolName') ?? '').trim();
    const selectedDirectorySchool = getPreviousSchoolSelection(previousSchoolValue);
    const previousSchoolLabel =
      previousSchoolValue === 'manual'
        ? manualSchoolName
        : selectedDirectorySchool?.label.replace(/\s*\([^)]*\)$/, '') ?? '';

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/clearance/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          parentName,
          parentPhone,
          previousSchoolName: previousSchoolLabel,
          gender: String(formData.get('gender') ?? '').trim(),
          lastClass: String(formData.get('lastClass') ?? '').trim(),
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; routeUrl?: string } | null;

      if (!response.ok || !result?.ok || !result.routeUrl) {
        setErrorMessage(result?.message ?? 'Unable to start clearance request. Please try again.');
        return;
      }

      router.push(result.routeUrl);
    } catch {
      setErrorMessage('Unable to start clearance request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="clearance-request-form"
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="space-y-1">
        <label htmlFor="studentName" className="block text-xs font-semibold text-navy-800">
          Student&apos;s Full Name
        </label>
        <input
          id="studentName"
          name="studentName"
          type="text"
          required
          placeholder="e.g. Chinedu Okafor"
          className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="gender" className="block text-xs font-semibold text-navy-800">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
            defaultValue="Male"
          >
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="lastClass" className="block text-xs font-semibold text-navy-800">
            Last Class Attended
          </label>
          <select
            id="lastClass"
            name="lastClass"
            className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
            defaultValue="Basic 6"
          >
            <option>Basic 6</option>
            <option>JSS 1</option>
            <option>JSS 2</option>
            <option>JSS 3</option>
            <option>SSS 1</option>
            <option>SSS 2</option>
            <option>SSS 3</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="parentName" className="block text-xs font-semibold text-navy-800">
          Parent / Guardian Full Name
        </label>
        <input
          id="parentName"
          name="parentName"
          type="text"
          required
          placeholder="e.g. Mr. Emeka Okafor"
          className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="parentPhone" className="block text-xs font-semibold text-navy-800">
          Parent Phone Number (Key for Matching)
        </label>
        <input
          id="parentPhone"
          name="parentPhone"
          type="tel"
          required
          placeholder="e.g. +234 803 123 4567"
          className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
        />
        <span className="text-[10px] text-slate-500">
          Phone numbers are normalized and matched against unresolved school balances.
        </span>
      </div>

      <div className="space-y-1">
        <label htmlFor="previousSchool" className="block text-xs font-semibold text-navy-800">
          Previous Attending School
        </label>
        <select
          id="previousSchool"
          name="previousSchool"
          value={selectedSchool}
          onChange={(event) => setSelectedSchool(event.target.value)}
          className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
        >
          {previousSchoolOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {selectedSchool === 'manual' ? (
        <div className="space-y-1">
          <label htmlFor="manualSchoolName" className="block text-xs font-semibold text-navy-800">
            Specify Previous School Name
          </label>
          <input
            id="manualSchoolName"
            name="manualSchoolName"
            type="text"
            required
            placeholder="e.g. Bright Future Academy, Nyanya"
            className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <span className="text-[10px] text-slate-500">
            Use this when the previous school is not yet listed in the EduClearance directory.
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-xl border border-background-secondary bg-background p-4 text-sm">
        <div>
          <p className="font-semibold text-navy-900">Check Fee</p>
          <p className="text-xs text-slate-500">Charged from school wallet balance</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-navy-900">₦100</p>
          <p className="text-xs text-emerald-600">
            Balance: {formatNairaFromKobo(walletBalanceKobo)} · {formatChecksFromKobo(remainingBalanceKobo)} checks after charge
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-terracotta-200 bg-terracotta-50 p-3 text-xs font-medium text-terracotta-700">
          {errorMessage}{' '}
          <a href={withRoleQuery('/wallet', role)} className="font-semibold underline">
            Go to wallet
          </a>
          .
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? 'Starting Clearance Check…' : 'Run Clearance Check'}
      </button>
    </form>
  );
}
