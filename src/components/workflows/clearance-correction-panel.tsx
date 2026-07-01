'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { normalizeSearchText } from '@/lib/text';

type DirectorySchoolOption = {
  id: string;
  name: string;
  area: string | null;
  address: string | null;
  status: 'unclaimed' | 'pending' | 'active' | 'suspended';
};

type ClearanceCorrectionPanelProps = {
  clearanceRequestId: string;
  studentName: string;
  previousSchoolName: string;
  correctionCount: number;
  schools: DirectorySchoolOption[];
};

function splitNameParts(studentName: string) {
  const parts = studentName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function schoolLabel(school: DirectorySchoolOption) {
  return `${school.name}${school.area ? ` (${school.area})` : ''}`;
}

function schoolSearchText(school: DirectorySchoolOption) {
  return normalizeSearchText([school.name, school.area, school.address, school.status].filter(Boolean).join(' '));
}

export function ClearanceCorrectionPanel({ clearanceRequestId, studentName, previousSchoolName, correctionCount, schools }: ClearanceCorrectionPanelProps) {
  const router = useRouter();
  const initialNameParts = useMemo(() => splitNameParts(studentName), [studentName]);
  const [firstName, setFirstName] = useState(initialNameParts.firstName);
  const [middleName, setMiddleName] = useState(initialNameParts.middleName);
  const [lastName, setLastName] = useState(initialNameParts.lastName);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [schoolSearch, setSchoolSearch] = useState(previousSchoolName);
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCorrect = correctionCount < 1;
  const selectedDirectorySchool = useMemo(() => schools.find((school) => school.id === selectedSchoolId) ?? null, [schools, selectedSchoolId]);
  const suggestedSchools = useMemo(() => {
    const query = normalizeSearchText(schoolSearch);

    if (!query) {
      return schools.slice(0, 6);
    }

    return schools
      .map((school) => ({ school, score: schoolSearchText(school).includes(query) ? 2 : normalizeSearchText(school.name).split(' ').filter((part) => query.includes(part)).length }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name))
      .slice(0, 6)
      .map((entry) => entry.school);
  }, [schoolSearch, schools]);

  async function submitCorrection() {
    if (!canCorrect) {
      setNotice('This request already used its one allowed correction. Start a new paid check if the details are still wrong.');
      return;
    }

    const previousSchoolLabel = selectedDirectorySchool ? selectedDirectorySchool.name : schoolSearch.trim();

    if (!firstName.trim() || !previousSchoolLabel) {
      setNotice('Enter the corrected student name and previous school.');
      return;
    }

    setIsSubmitting(true);
    setNotice('');

    try {
      const response = await fetch('/api/clearance/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearanceRequestId,
          studentFirstName: firstName,
          studentMiddleName: middleName,
          studentLastName: lastName,
          previousSchoolId: selectedDirectorySchool?.id ?? null,
          previousSchoolName: previousSchoolLabel,
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; routeUrl?: string } | null;

      if (!response.ok || !result?.ok) {
        setNotice(result?.message ?? 'Unable to correct this request.');
        return;
      }

      router.refresh();
      setNotice('Correction saved. EduClearance re-ran the match on this request.');
    } catch {
      setNotice('Unable to correct this request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-background-secondary bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Correct possible typo</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            If this was a typo, you can correct the student name order/spelling or previous school once. The same request is rechecked; broad edits require a new check.
          </p>
        </div>
        <span className="rounded-full border border-background-secondary bg-background px-2 py-1 text-[10px] font-bold text-slate-500 flex-shrink-0 whitespace-nowrap">
          {Math.max(0, 1 - correctionCount)} edit left
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            value={firstName}
            disabled={!canCorrect}
            onChange={(event) => setFirstName(event.currentTarget.value)}
            placeholder="First name"
            className="rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800 disabled:bg-slate-100"
          />
          <input
            value={middleName}
            disabled={!canCorrect}
            onChange={(event) => setMiddleName(event.currentTarget.value)}
            placeholder="Middle name"
            className="rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800 disabled:bg-slate-100"
          />
          <input
            value={lastName}
            disabled={!canCorrect}
            onChange={(event) => setLastName(event.currentTarget.value)}
            placeholder="Last name"
            className="rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800 disabled:bg-slate-100"
          />
        </div>

        <div className="space-y-2">
          <input
            type="search"
            value={schoolSearch}
            disabled={!canCorrect}
            onChange={(event) => {
              setSchoolSearch(event.currentTarget.value);
              setSelectedSchoolId(null);
            }}
            placeholder="Correct previous school"
            className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800 disabled:bg-slate-100"
          />
          {canCorrect ? (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-background-secondary bg-background p-2">
              {suggestedSchools.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-slate-500">No directory match. Keep the typed school name if it is correct.</p>
              ) : suggestedSchools.map((school) => (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => {
                    setSelectedSchoolId(school.id);
                    setSchoolSearch(schoolLabel(school));
                  }}
                  className={`block w-full rounded-lg px-2 py-1.5 text-left text-[11px] transition ${selectedSchoolId === school.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-white'}`}
                >
                  <span className="block font-semibold sm:inline">{school.name}</span>
                  <span className="block text-[10px] opacity-75 sm:inline sm:ml-2 sm:text-[11px]">
                    {school.area ?? school.address ?? 'Area not listed'}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {notice ? <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-[11px] text-amber-800">{notice}</div> : null}

        <button
          type="button"
          onClick={() => void submitCorrection()}
          disabled={!canCorrect || isSubmitting}
          className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? 'Saving correction…' : canCorrect ? 'Save correction & recheck' : 'Correction already used'}
        </button>
      </div>
    </section>
  );
}
