'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';

import { normalizeSearchText } from '@/lib/text';

type SchoolStatus = 'unclaimed' | 'pending' | 'active' | 'suspended';
type ClaimFlowState = 'search' | 'claim' | 'new-school' | 'auth-required' | 'pending';
type ClaimType = 'existing_school' | 'new_school';

type DirectorySchool = {
  id: string;
  name: string;
  location: string;
  area: string | null;
  address: string | null;
  status: SchoolStatus;
};

type CurrentUser = {
  name: string;
  email: string;
  role: string;
};

type PendingSubmission = {
  claimType: ClaimType;
  schoolName: string;
  location: string;
  applicantName: string;
  applicantEmail: string;
  officialContactName: string;
  officialEmail: string;
  officialPhone: string;
  officialWhatsappPhone: string;
  proofFileName: string;
  proofNote: string;
};

const statusStyles: Record<SchoolStatus, string> = {
  unclaimed: 'border border-amber-100 bg-amber-50 text-amber-600',
  pending: 'border border-amber-100 bg-amber-50 text-amber-600',
  active: 'border border-emerald-100 bg-emerald-50 text-emerald-600',
  suspended: 'border border-terracotta-100 bg-terracotta-50 text-terracotta-600',
};

const statusLabels: Record<SchoolStatus, string> = {
  unclaimed: 'Unclaimed',
  pending: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
};

function StepLabel({ currentStep, step, label }: { currentStep: number; step: number; label: string }) {
  const isActive = currentStep === step;

  return <div className={isActive ? 'font-bold text-navy-900' : 'text-slate-500'}>{step}. {label}</div>;
}

type ClaimSchoolFlowProps = {
  directorySchools: DirectorySchool[];
  currentUser: CurrentUser | null;
};

const MAX_PROOF_FILE_BYTES = 2_000_000;

function readProofFile(form: HTMLFormElement, name: string): Promise<{ name: string; type: string; size: number; dataUrl: string } | null> {
  const input = form.elements.namedItem(name);

  if (!(input instanceof HTMLInputElement) || input.type !== 'file') {
    return Promise.resolve(null);
  }

  const file = input.files?.[0];

  if (!file) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: String(reader.result ?? '') });
    reader.onerror = () => reject(new Error('Unable to read proof file.'));
    reader.readAsDataURL(file);
  });
}

export function ClaimSchoolFlow({ directorySchools, currentUser }: ClaimSchoolFlowProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [flowState, setFlowState] = useState<ClaimFlowState>('search');
  const [selectedSchool, setSelectedSchool] = useState<DirectorySchool | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);
  const [claimProofFileName, setClaimProofFileName] = useState('');
  const [newSchoolProofFileName, setNewSchoolProofFileName] = useState('');
  const [newSchoolNameQuery, setNewSchoolNameQuery] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [claimWhatsappSameAsPhone, setClaimWhatsappSameAsPhone] = useState(true);
  const [newSchoolWhatsappSameAsPhone, setNewSchoolWhatsappSameAsPhone] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const filteredSchools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      return [];
    }

    return directorySchools.filter((school) => `${school.name} ${school.location}`.toLowerCase().includes(query));
  }, [directorySchools, searchQuery]);

  const similarNewSchoolMatches = useMemo(() => {
    const query = normalizeSearchText(newSchoolNameQuery);

    if (query.length < 3) {
      return [];
    }

    return directorySchools
      .map((school) => {
        const searchable = normalizeSearchText(`${school.name} ${school.location} ${school.area ?? ''} ${school.address ?? ''}`);
        const wordOverlap = query.split(' ').filter((part) => part.length > 2 && searchable.includes(part)).length;
        const score = searchable.includes(query) ? 10 : wordOverlap;
        return { school, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name))
      .slice(0, 3)
      .map((entry) => entry.school);
  }, [directorySchools, newSchoolNameQuery]);

  const currentStep = flowState === 'pending' ? 3 : flowState === 'search' ? 1 : 2;
  const canSubmitClaims = Boolean(currentUser && currentUser.role !== 'platform_admin');
  const applicantUser = canSubmitClaims ? currentUser : null;

  function resetFlow() {
    setSearchQuery('');
    setSelectedSchool(null);
    setPendingSubmission(null);
    setClaimProofFileName('');
    setNewSchoolProofFileName('');
    setNewSchoolNameQuery('');
    setSubmissionError('');
    setClaimWhatsappSameAsPhone(true);
    setNewSchoolWhatsappSameAsPhone(true);
    setFlowState('search');
  }

  function promptAuth(school: DirectorySchool | null = null) {
    setSelectedSchool(school);
    setSubmissionError('');
    setFlowState('auth-required');
  }

  function handleSchoolSelect(school: DirectorySchool) {
    if (school.status !== 'unclaimed') {
      return;
    }

    if (!canSubmitClaims) {
      promptAuth(school);
      return;
    }

    setSelectedSchool(school);
    setSubmissionError('');
    setFlowState('claim');
  }

  function handleNewSchoolRequest() {
    if (!canSubmitClaims) {
      promptAuth();
      return;
    }

    setSelectedSchool(null);
    setSubmissionError('');
    setFlowState('new-school');
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsSigningOut(false);
    resetFlow();
    router.refresh();
  }

  async function submitClaimForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSchool || !currentUser) {
      promptAuth(selectedSchool);
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const proofFile = await readProofFile(form, 'proofFile');

    if (!proofFile) {
      setSubmissionError('Select a proof document before submitting.');
      return;
    }

    if (proofFile.size > MAX_PROOF_FILE_BYTES) {
      setSubmissionError('Proof document must be 2MB or smaller.');
      return;
    }

    const officialPhone = String(formData.get('officialPhone') ?? '').trim();
    const officialWhatsappPhone = claimWhatsappSameAsPhone ? officialPhone : String(formData.get('officialWhatsappPhone') ?? '').trim();
    const payload = {
      claimType: 'existing_school' as const,
      schoolId: selectedSchool.id,
      requestedSchoolName: selectedSchool.name,
      requestedArea: selectedSchool.area ?? selectedSchool.location,
      requestedAddress: selectedSchool.address ?? selectedSchool.location,
      officialContactName: String(formData.get('officialContactName') ?? '').trim(),
      officialEmail: String(formData.get('officialEmail') ?? '').trim(),
      officialPhone,
      officialWhatsappPhone,
      proofFileName: proofFile.name,
      proofFileType: proofFile.type,
      proofFileSize: proofFile.size,
      proofFileDataUrl: proofFile.dataUrl,
      proofNote: String(formData.get('proofNote') ?? '').trim(),
    };

    setIsSubmitting(true);
    setSubmissionError('');

    const response = await fetch('/api/school-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    setIsSubmitting(false);

    if (!response.ok || !result?.ok) {
      setSubmissionError(result?.message ?? 'Unable to submit the claim right now.');
      return;
    }

    setPendingSubmission({
      claimType: 'existing_school',
      schoolName: selectedSchool.name,
      location: selectedSchool.location,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
      officialContactName: payload.officialContactName,
      officialEmail: payload.officialEmail,
      officialPhone: payload.officialPhone,
      officialWhatsappPhone: payload.officialWhatsappPhone,
      proofFileName: proofFile.name,
      proofNote: payload.proofNote,
    });
    setFlowState('pending');
  }

  async function submitNewSchoolForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      promptAuth();
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const proofFile = await readProofFile(form, 'proofFile');

    if (!proofFile) {
      setSubmissionError('Select a proof document before submitting.');
      return;
    }

    if (proofFile.size > MAX_PROOF_FILE_BYTES) {
      setSubmissionError('Proof document must be 2MB or smaller.');
      return;
    }

    const officialPhone = String(formData.get('officialPhone') ?? '').trim();
    const officialWhatsappPhone = newSchoolWhatsappSameAsPhone ? officialPhone : String(formData.get('officialWhatsappPhone') ?? '').trim();
    const payload = {
      claimType: 'new_school' as const,
      requestedSchoolName: String(formData.get('schoolName') ?? '').trim(),
      requestedArea: String(formData.get('schoolArea') ?? '').trim(),
      requestedAddress: String(formData.get('schoolAddress') ?? '').trim(),
      officialContactName: String(formData.get('officialContactName') ?? '').trim(),
      officialEmail: String(formData.get('officialEmail') ?? '').trim(),
      officialPhone,
      officialWhatsappPhone,
      proofFileName: proofFile.name,
      proofFileType: proofFile.type,
      proofFileSize: proofFile.size,
      proofFileDataUrl: proofFile.dataUrl,
      proofNote: String(formData.get('proofNote') ?? '').trim(),
    };

    setIsSubmitting(true);
    setSubmissionError('');

    const response = await fetch('/api/school-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    setIsSubmitting(false);

    if (!response.ok || !result?.ok) {
      setSubmissionError(result?.message ?? 'Unable to submit the request right now.');
      return;
    }

    setPendingSubmission({
      claimType: 'new_school',
      schoolName: payload.requestedSchoolName,
      location: `${payload.requestedArea} · ${payload.requestedAddress}`,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
      officialContactName: payload.officialContactName,
      officialEmail: payload.officialEmail,
      officialPhone: payload.officialPhone,
      officialWhatsappPhone: payload.officialWhatsappPhone,
      proofFileName: proofFile.name,
      proofNote: payload.proofNote,
    });
    setFlowState('pending');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between border-b border-background-secondary pb-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 font-display font-bold text-white shadow-sm">EC</div>
          <span className="font-display text-lg font-bold text-navy-900">EduClearance</span>
        </Link>
        {currentUser ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden text-slate-500 sm:inline">{currentUser.name}</span>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="font-medium text-navy-900 hover:underline disabled:cursor-wait disabled:text-slate-400"
            >
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        ) : (
          <Link href="/login?redirect=/claim-school" className="text-xs font-medium text-navy-900 hover:underline">
            Sign in
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 border-b border-background-secondary pb-4 text-center text-xs font-semibold uppercase tracking-wider">
        <StepLabel currentStep={currentStep} step={1} label="Find School" />
        <StepLabel currentStep={currentStep} step={2} label="Submit Proof" />
        <StepLabel currentStep={currentStep} step={3} label="Review" />
      </div>

      {flowState === 'search' ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8" id="step-1">
          <h1 className="text-2xl font-bold text-navy-900">Search the School Directory</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Find your school in the directory. Only schools with an <strong>Unclaimed</strong> status can be claimed here.
            If your school is not listed, you can request a new profile instead.
          </p>

          <div className="space-y-3">
            <div className="relative">
              <label htmlFor="search-box" className="sr-only">
                Search school directory
              </label>
              <input
                id="search-box"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Type school name or location (e.g. American, Garki, Abuja)"
                className="w-full rounded-lg border border-background-secondary bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {searchQuery.trim().length >= 2 ? (
              filteredSchools.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-background-secondary bg-background">
                  {filteredSchools.map((school, index) => {
                    const isClaimable = school.status === 'unclaimed';

                    return (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => handleSchoolSelect(school)}
                        disabled={!isClaimable}
                        className={[
                          'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition',
                          index < filteredSchools.length - 1 ? 'border-b border-background-secondary' : '',
                          isClaimable ? 'hover:bg-white' : 'cursor-not-allowed opacity-80',
                        ].join(' ')}
                      >
                        <div>
                          <p className="font-semibold text-navy-900">{school.name}</p>
                          <p className="text-xs text-slate-500">{school.location}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[school.status]}`}>
                          {statusLabels[school.status]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-background-secondary bg-background px-4 py-3 text-sm text-slate-500">
                  No school match found yet. You can request a new school profile below.
                </div>
              )
            ) : null}
          </div>

          <div className="border-t border-background-secondary pt-4 text-center">
            <button type="button" onClick={handleNewSchoolRequest} className="text-sm font-semibold text-navy-900 hover:underline">
              Can&apos;t find your school? Request a new school profile
            </button>
          </div>
        </div>
      ) : null}

      {flowState === 'auth-required' ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-navy-900">Sign in to continue</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Your signed-in account stays as the applicant. Platform admin accounts cannot submit claims here, and school users still need a verified login before submitting a claim or new-school request.
            </p>
          </div>

          {selectedSchool ? (
            <div className="rounded-xl border border-background-secondary bg-background p-4 text-sm text-slate-600">
              <p className="font-semibold text-navy-900">Claiming: {selectedSchool.name}</p>
              <p className="mt-1 text-xs text-slate-500">{selectedSchool.location}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login?redirect=/claim-school" className="flex-1 rounded-lg bg-navy-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-navy-800">
              Sign in
            </Link>
            <Link href="/register?redirect=/claim-school" className="flex-1 rounded-lg border border-background-secondary bg-white px-4 py-3 text-center text-sm font-medium text-navy-900 transition hover:bg-background-secondary">
              Create account
            </Link>
          </div>

          <button type="button" onClick={resetFlow} className="text-sm font-medium text-slate-500 hover:text-navy-900">
            ← Back to search
          </button>
        </div>
      ) : null}

      {flowState === 'claim' && selectedSchool && applicantUser ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8" id="claim-form">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-navy-900">Claim School Profile</h2>
            <button type="button" onClick={resetFlow} className="text-xs text-slate-500 hover:underline">
              ← Back
            </button>
          </div>

          <p className="text-sm text-slate-600">
            You are submitting this claim as <strong className="text-navy-900">{applicantUser.name}</strong> ({applicantUser.email}).
          </p>

          <div className="rounded-xl border border-background-secondary bg-background p-4 text-sm text-slate-600">
            <p className="font-semibold text-navy-900">School being claimed</p>
            <p className="mt-1">{selectedSchool.name}</p>
            <p className="text-xs text-slate-500">{selectedSchool.location}</p>
          </div>

          <form className="space-y-4" onSubmit={submitClaimForm}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="official-contact-name" className="block text-xs font-semibold text-navy-800">
                  Official Contact Name
                </label>
                <input
                  id="official-contact-name"
                  name="officialContactName"
                  type="text"
                  required
                  placeholder="e.g. Chief Mrs. Alabi"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="official-email" className="block text-xs font-semibold text-navy-800">
                  Official School Email
                </label>
                <input
                  id="official-email"
                  name="officialEmail"
                  type="email"
                  required
                  placeholder="clearance@yourschool.edu.ng"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="official-phone" className="block text-xs font-semibold text-navy-800">
                  Official Clearance Phone
                </label>
                <input
                  id="official-phone"
                  name="officialPhone"
                  type="tel"
                  inputMode="tel"
                  pattern="[+0-9()\\s-]{10,20}"
                  title="Enter a real phone number, e.g. +234 803 123 4567"
                  required
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="official-whatsapp-phone" className="block text-xs font-semibold text-navy-800">
                  WhatsApp Line
                </label>
                <input
                  id="official-whatsapp-phone"
                  name="officialWhatsappPhone"
                  type="tel"
                  inputMode="tel"
                  pattern="[+0-9()\\s-]{10,20}"
                  title="Enter a real WhatsApp number, e.g. +234 803 123 4567"
                  required={!claimWhatsappSameAsPhone}
                  disabled={claimWhatsappSameAsPhone}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={claimWhatsappSameAsPhone}
                    onChange={(event) => setClaimWhatsappSameAsPhone(event.currentTarget.checked)}
                    className="h-4 w-4 rounded border-background-secondary text-navy-900 focus:ring-navy-900"
                  />
                  Same number for WhatsApp
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="claim-proof-note" className="block text-xs font-semibold text-navy-800">
                Proof Note
              </label>
              <textarea
                id="claim-proof-note"
                name="proofNote"
                required
                rows={3}
                placeholder="Briefly explain what this document proves and who can verify it."
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="claim-proof-file" className="block text-xs font-semibold text-navy-800">
                Proof Document
              </label>
              <input
                id="claim-proof-file"
                name="proofFile"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                onChange={(event) => setClaimProofFileName(event.currentTarget.files?.[0]?.name ?? '')}
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
              <p className="text-xs text-slate-500">
                PDF, PNG, or JPG. Max 2MB. Admins can view the submitted file during review.
              </p>
              {claimProofFileName ? <p className="text-xs font-medium text-navy-900">Proof document selected: {claimProofFileName}</p> : null}
            </div>

            {submissionError ? (
              <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-3 text-xs font-medium text-terracotta-700">{submissionError}</div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-90"
            >
              {isSubmitting ? 'Submitting claim…' : 'Submit Claim for Review'}
            </button>
          </form>
        </div>
      ) : null}

      {flowState === 'new-school' && applicantUser ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8" id="new-school-form">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-navy-900">Register New School Profile</h2>
            <button type="button" onClick={resetFlow} className="text-xs text-slate-500 hover:underline">
              ← Back
            </button>
          </div>

          <p className="text-sm text-slate-500">
            Your account stays the applicant. Add the school&apos;s official contact details so the admin team can review the request.
          </p>

          <form className="space-y-4" onSubmit={submitNewSchoolForm}>
            <div className="space-y-1">
              <label htmlFor="school-name" className="block text-xs font-semibold text-navy-800">
                Official School Name
              </label>
              <input
                id="school-name"
                name="schoolName"
                type="text"
                required
                value={newSchoolNameQuery}
                onChange={(event) => setNewSchoolNameQuery(event.currentTarget.value)}
                placeholder="e.g. New Abuja Model School"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
              {similarNewSchoolMatches.length > 0 ? (
                <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold text-navy-900">Did you mean one of these existing schools?</p>
                  <div className="mt-2 space-y-1">
                    {similarNewSchoolMatches.map((school) => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => {
                          setSelectedSchool(school);
                          setFlowState('claim');
                        }}
                        className="block w-full rounded-lg bg-white px-3 py-2 text-left text-navy-900 hover:bg-background-secondary"
                      >
                        {school.name} <span className="text-slate-500">· {school.location}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-amber-700">If none of these are correct, keep typing the new school name.</p>
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="school-area" className="block text-xs font-semibold text-navy-800">
                  LGA / Area
                </label>
                <input
                  id="school-area"
                  name="schoolArea"
                  type="text"
                  required
                  placeholder="e.g. Alimosho"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="school-address" className="block text-xs font-semibold text-navy-800">
                  School Physical Address
                </label>
                <input
                  id="school-address"
                  name="schoolAddress"
                  type="text"
                  required
                  placeholder="e.g. 15, Airport Road"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="new-official-contact-name" className="block text-xs font-semibold text-navy-800">
                  Official Contact Name
                </label>
                <input
                  id="new-official-contact-name"
                  name="officialContactName"
                  type="text"
                  required
                  placeholder="e.g. Mrs. Alabi"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="new-official-email" className="block text-xs font-semibold text-navy-800">
                  Official School Email
                </label>
                <input
                  id="new-official-email"
                  name="officialEmail"
                  type="email"
                  required
                  placeholder="records@yourschool.edu.ng"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="new-official-phone" className="block text-xs font-semibold text-navy-800">
                  Official Clearance Phone
                </label>
                <input
                  id="new-official-phone"
                  name="officialPhone"
                  type="tel"
                  inputMode="tel"
                  pattern="[+0-9()\\s-]{10,20}"
                  title="Enter a real phone number, e.g. +234 803 123 4567"
                  required
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="new-official-whatsapp-phone" className="block text-xs font-semibold text-navy-800">
                  WhatsApp Line
                </label>
                <input
                  id="new-official-whatsapp-phone"
                  name="officialWhatsappPhone"
                  type="tel"
                  inputMode="tel"
                  pattern="[+0-9()\\s-]{10,20}"
                  title="Enter a real WhatsApp number, e.g. +234 803 123 4567"
                  required={!newSchoolWhatsappSameAsPhone}
                  disabled={newSchoolWhatsappSameAsPhone}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={newSchoolWhatsappSameAsPhone}
                    onChange={(event) => setNewSchoolWhatsappSameAsPhone(event.currentTarget.checked)}
                    className="h-4 w-4 rounded border-background-secondary text-navy-900 focus:ring-navy-900"
                  />
                  Same number for WhatsApp
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="new-proof-note" className="block text-xs font-semibold text-navy-800">
                Proof Note
              </label>
              <textarea
                id="new-proof-note"
                name="proofNote"
                required
                rows={3}
                placeholder="Summarize the licence, incorporation, or letterhead included."
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-proof-file" className="block text-xs font-semibold text-navy-800">
                Proof Document
              </label>
              <input
                id="new-proof-file"
                name="proofFile"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                onChange={(event) => setNewSchoolProofFileName(event.currentTarget.files?.[0]?.name ?? '')}
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
              <p className="text-xs text-slate-500">PDF, PNG, or JPG. Max 2MB. Admins can view the submitted file during review.</p>
              {newSchoolProofFileName ? <p className="text-xs font-medium text-navy-900">Proof document selected: {newSchoolProofFileName}</p> : null}
            </div>

            {submissionError ? (
              <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-3 text-xs font-medium text-terracotta-700">{submissionError}</div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-90"
            >
              {isSubmitting ? 'Submitting request…' : 'Submit New Profile Request'}
            </button>
          </form>
        </div>
      ) : null}

      {flowState === 'pending' && pendingSubmission ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-8 text-center shadow-sm" id="pending-page">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-navy-900">Request submitted for review</h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
              The admin team will review your proof document metadata and official contact details for <strong>{pendingSubmission.schoolName}</strong>.
              If anything is unclear, they may follow up using the applicant account or the official school contact details you provided.
            </p>
          </div>
          <div className="mx-auto max-w-xl rounded-lg border border-background-secondary bg-background p-4 text-left text-xs text-slate-500">
            <span className="mb-1 block font-semibold uppercase tracking-widest text-navy-900">Submission summary</span>
            <p className="text-slate-600">Applicant: {pendingSubmission.applicantName} ({pendingSubmission.applicantEmail})</p>
            <p className="mt-2 text-slate-600">Official contact: {pendingSubmission.officialContactName}</p>
            <p className="mt-2 text-slate-600">Official email: {pendingSubmission.officialEmail}</p>
            <p className="mt-2 text-slate-600">Clearance phone: {pendingSubmission.officialPhone}</p>
            <p className="mt-2 text-slate-600">WhatsApp line: {pendingSubmission.officialWhatsappPhone}</p>
            <p className="mt-2 text-slate-600">Proof document selected: {pendingSubmission.proofFileName}</p>
            <p className="mt-2 text-slate-600">Proof note: {pendingSubmission.proofNote}</p>
            <p className="mt-3 text-slate-500">Wallet/top-up/payment setup may still be required before clearance checks are enabled.</p>
          </div>
          <div className="pt-4">
            <Link href="/account/pending-verification" className="inline-block rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">
              View Verification Status
            </Link>
          </div>
          <button type="button" onClick={resetFlow} className="mx-auto text-sm font-medium text-slate-500 hover:text-navy-900">
            Submit another {pendingSubmission.claimType === 'existing_school' ? 'claim' : 'school request'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
