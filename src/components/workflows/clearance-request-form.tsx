'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { type SchoolUserRole, withRoleQuery } from '@/lib/local-school-data';
import { CHECK_PRICE_KOBO, formatChecksFromKobo, formatNairaFromKobo } from '@/lib/money';
import { buildStudentDisplayName, normalizeSearchText } from '@/lib/text';

type DirectorySchoolOption = {
  id: string;
  name: string;
  area: string | null;
  address: string | null;
  status: 'unclaimed' | 'pending' | 'active' | 'suspended';
};

type ClearanceRequestFormProps = {
  role: SchoolUserRole;
  walletBalanceKobo: number;
  schools: DirectorySchoolOption[];
};

function schoolLabel(school: DirectorySchoolOption) {
  return `${school.name}${school.area ? ` (${school.area})` : ''}`;
}

function schoolSearchText(school: DirectorySchoolOption) {
  return normalizeSearchText([school.name, school.area, school.address, school.status].filter(Boolean).join(' '));
}

export function ClearanceRequestForm({ role, walletBalanceKobo, schools }: ClearanceRequestFormProps) {
  const router = useRouter();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(schools[0]?.id ?? null);
  const [schoolSearch, setSchoolSearch] = useState(schools[0] ? schoolLabel(schools[0]) : '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingBalanceKobo = useMemo(() => Math.max(walletBalanceKobo - CHECK_PRICE_KOBO, 0), [walletBalanceKobo]);
  const selectedDirectorySchool = useMemo(() => schools.find((school) => school.id === selectedSchoolId) ?? null, [schools, selectedSchoolId]);
  const suggestedSchools = useMemo(() => {
    const query = normalizeSearchText(schoolSearch);

    if (!query) {
      return schools.slice(0, 8);
    }

    return schools
      .map((school) => ({ school, score: schoolSearchText(school).includes(query) ? 2 : normalizeSearchText(school.name).split(' ').filter((part) => query.includes(part)).length }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name))
      .slice(0, 8)
      .map((entry) => entry.school);
  }, [schoolSearch, schools]);

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
    const studentFirstName = String(formData.get('studentFirstName') ?? '').trim();
    const studentMiddleName = String(formData.get('studentMiddleName') ?? '').trim();
    const studentLastName = String(formData.get('studentLastName') ?? '').trim();
    const studentName = buildStudentDisplayName(studentFirstName, studentMiddleName, studentLastName);
    const parentName = String(formData.get('parentName') ?? '').trim();
    const parentPhone = String(formData.get('parentPhone') ?? '').trim();
    const manualSchoolName = String(formData.get('manualSchoolName') ?? '').trim();
    const previousSchoolLabel = selectedDirectorySchool ? selectedDirectorySchool.name : manualSchoolName || schoolSearch.trim();

    if (!previousSchoolLabel) {
      setErrorMessage('Search for a previous school or enter the school name manually.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/clearance/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          studentFirstName,
          studentMiddleName,
          studentLastName,
          parentName,
          parentPhone,
          previousSchoolId: selectedDirectorySchool?.id ?? null,
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
      <div className="space-y-2">
        <p className="block text-xs font-semibold text-navy-800">Student Name</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="studentFirstName" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">First name</label>
            <input id="studentFirstName" name="studentFirstName" type="text" required placeholder="e.g. Aisha" className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800" />
          </div>
          <div className="space-y-1">
            <label htmlFor="studentMiddleName" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Middle name</label>
            <input id="studentMiddleName" name="studentMiddleName" type="text" placeholder="Optional" className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800" />
          </div>
          <div className="space-y-1">
            <label htmlFor="studentLastName" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Last name</label>
            <input id="studentLastName" name="studentLastName" type="text" placeholder="Optional" className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800" />
          </div>
        </div>
        <p className="text-[10px] text-slate-500">Splitting names helps EduClearance catch swapped or partially entered names without treating every similar record as confirmed.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="gender" className="block text-xs font-semibold text-navy-800">Gender</label>
          <select id="gender" name="gender" className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800" defaultValue="Male">
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="lastClass" className="block text-xs font-semibold text-navy-800">Last Class Attended</label>
          <select id="lastClass" name="lastClass" className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800" defaultValue="Basic 6">
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
        <label htmlFor="parentName" className="block text-xs font-semibold text-navy-800">Parent / Guardian Full Name</label>
        <input id="parentName" name="parentName" type="text" required placeholder="e.g. Mr. Emeka Okafor" className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800" />
      </div>

      <div className="space-y-1">
        <label htmlFor="parentPhone" className="block text-xs font-semibold text-navy-800">Parent Phone Number (Key for Matching)</label>
        <input id="parentPhone" name="parentPhone" type="tel" inputMode="tel" pattern="[+0-9()\\s-]{10,20}" title="Enter a real phone number, e.g. +234 803 123 4567" required placeholder="e.g. +234 803 123 4567" className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800" />
        <span className="text-[10px] text-slate-500">Phone numbers are normalized and matched against unresolved school balances.</span>
      </div>

      <div className="space-y-2">
        <label htmlFor="previousSchoolSearch" className="block text-xs font-semibold text-navy-800">Previous Attending School</label>
        <input
          id="previousSchoolSearch"
          type="search"
          value={schoolSearch}
          onChange={(event) => {
            setSchoolSearch(event.target.value);
            setSelectedSchoolId(null);
          }}
          placeholder="Search by school name, area, or address"
          className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
        />
        <div className="max-h-56 overflow-y-auto rounded-xl border border-background-secondary bg-white p-2">
          {suggestedSchools.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">No close directory match yet. Use the manual name below.</p>
          ) : suggestedSchools.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => {
                setSelectedSchoolId(school.id);
                setSchoolSearch(schoolLabel(school));
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition ${selectedSchoolId === school.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-background'}`}
            >
              <span className="font-semibold">{school.name}</span>
              <span className="ml-2 opacity-75">{school.area ?? school.address ?? 'Area not listed'} · {school.status}</span>
            </button>
          ))}
        </div>
        <input
          name="manualSchoolName"
          type="text"
          value={selectedDirectorySchool ? '' : schoolSearch}
          onChange={(event) => {
            setSelectedSchoolId(null);
            setSchoolSearch(event.target.value);
          }}
          placeholder="If not listed, type the previous school name here"
          className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
        />
        {selectedDirectorySchool ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] text-emerald-700">Selected directory school: {schoolLabel(selectedDirectorySchool)}</p>
        ) : (
          <p className="text-[10px] text-slate-500">If the exact school is not listed, keep the typed name. EduClearance will still create the request and flag it as not fully matched.</p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-background-secondary bg-background p-4 text-sm">
        <div>
          <p className="font-semibold text-navy-900">Check Fee</p>
          <p className="text-xs text-slate-500">Charged from school wallet balance</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-navy-900">₦100</p>
          <p className="text-xs text-emerald-600">Balance: {formatNairaFromKobo(walletBalanceKobo)} · {formatChecksFromKobo(remainingBalanceKobo)} checks after charge</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-terracotta-200 bg-terracotta-50 p-3 text-xs font-medium text-terracotta-700">
          {errorMessage}{' '}
          <a href={withRoleQuery('/wallet', role)} className="font-semibold underline">Go to wallet</a>.
        </div>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400">
        {isSubmitting ? 'Starting Clearance Check…' : 'Run Clearance Check'}
      </button>
    </form>
  );
}
