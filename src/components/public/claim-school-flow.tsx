'use client';

import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';

type SchoolStatus = 'unclaimed' | 'pending' | 'active' | 'suspended';
type ClaimFlowState = 'search' | 'claim' | 'new-school' | 'pending';

type DirectorySchool = {
  id: string;
  name: string;
  location: string;
  status: SchoolStatus;
};

type PendingSubmission = {
  schoolName: string;
  type: 'existing-school' | 'new-school';
};

const directorySchools: DirectorySchool[] = [
  {
    id: 'grace-academy',
    name: 'Grace Academy',
    location: 'Ikeja, Lagos State',
    status: 'unclaimed',
  },
  {
    id: 'grace-prep-school',
    name: 'Grace Prep School',
    location: 'Garki, FCT Abuja',
    status: 'unclaimed',
  },
  {
    id: 'springfield-international',
    name: 'Springfield International',
    location: 'Wuse II, FCT Abuja',
    status: 'pending',
  },
  {
    id: 'hilltop-preparatory',
    name: 'Hilltop Preparatory',
    location: 'Lekki, Lagos State',
    status: 'active',
  },
  {
    id: 'excel-college',
    name: 'Excel College',
    location: 'Surulere, Lagos State',
    status: 'suspended',
  },
];

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

  return (
    <div className={isActive ? 'font-bold text-navy-900' : 'text-slate-500'}>
      {step}. {label}
    </div>
  );
}

export function ClaimSchoolFlow() {
  const [searchQuery, setSearchQuery] = useState('');
  const [flowState, setFlowState] = useState<ClaimFlowState>('search');
  const [selectedSchool, setSelectedSchool] = useState<DirectorySchool | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);

  const filteredSchools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      return [];
    }

    return directorySchools.filter((school) => `${school.name} ${school.location}`.toLowerCase().includes(query));
  }, [searchQuery]);

  const currentStep = flowState === 'pending' ? 3 : flowState === 'search' ? 1 : 2;

  function handleSchoolSelect(school: DirectorySchool) {
    if (school.status !== 'unclaimed') {
      return;
    }

    setSelectedSchool(school);
    setFlowState('claim');
  }

  function handleNewSchoolRequest() {
    setSelectedSchool(null);
    setFlowState('new-school');
  }

  function resetFlow() {
    setSearchQuery('');
    setSelectedSchool(null);
    setPendingSubmission(null);
    setFlowState('search');
  }

  function submitClaimForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity() || !selectedSchool) {
      return;
    }

    setPendingSubmission({
      schoolName: selectedSchool.name,
      type: 'existing-school',
    });
    setFlowState('pending');
  }

  function submitNewSchoolForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const schoolName = formData.get('schoolName');

    setPendingSubmission({
      schoolName: typeof schoolName === 'string' && schoolName.trim() ? schoolName.trim() : 'Your school',
      type: 'new-school',
    });
    setFlowState('pending');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between border-b border-background-secondary pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-navy-900 px-2.5 py-1 font-display font-bold text-white">EC</div>
          <span className="font-display text-lg font-bold text-navy-900">EduClearance</span>
        </div>
        <Link href="/login" className="text-xs text-slate-500 hover:text-navy-900">
          Sign Out
        </Link>
      </div>

      <div className="grid grid-cols-3 border-b border-background-secondary pb-4 text-center text-xs font-semibold uppercase tracking-wider">
        <StepLabel currentStep={currentStep} step={1} label="Find School" />
        <StepLabel currentStep={currentStep} step={2} label="Submit Proof" />
        <StepLabel currentStep={currentStep} step={3} label="Verification" />
      </div>

      {flowState === 'search' ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8" id="step-1">
          <h1 className="text-2xl font-bold text-navy-900">Search the School Directory</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Select your school from our pre-seeded local school cluster directory. If your school is not yet listed, you can
            request a new profile.
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
                placeholder="Type school name or location (e.g. Grace)"
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
                  No school match found yet. You can register a new school profile below.
                </div>
              )
            ) : null}
          </div>

          <div className="border-t border-background-secondary pt-4 text-center">
            <button type="button" onClick={handleNewSchoolRequest} className="text-sm font-semibold text-navy-900 hover:underline">
              Can&apos;t find your school? Register as a new school profile
            </button>
          </div>
        </div>
      ) : null}

      {flowState === 'claim' && selectedSchool ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8" id="claim-form">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-navy-900">Claim School Profile</h2>
            <button type="button" onClick={resetFlow} className="text-xs text-slate-500 hover:underline">
              ← Back
            </button>
          </div>
          <p className="text-sm text-slate-600">
            You are claiming: <strong className="text-navy-900">{selectedSchool.name}, {selectedSchool.location}</strong>
          </p>

          <form className="space-y-4" onSubmit={submitClaimForm}>
            <div className="space-y-1">
              <label htmlFor="proprietor-name" className="block text-xs font-semibold text-navy-800">
                Proprietor / Admin Name
              </label>
              <input
                id="proprietor-name"
                type="text"
                required
                placeholder="e.g. Chief Mrs. Alabi"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="clearance-phone" className="block text-xs font-semibold text-navy-800">
                School Official Clearance Phone Number
              </label>
              <input
                id="clearance-phone"
                type="tel"
                required
                placeholder="e.g. +234 803 123 4567"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
              <span className="block text-xs text-slate-500">
                This phone number will be displayed to other schools when verifying transfer records.
              </span>
            </div>
            <div className="space-y-1">
              <label htmlFor="verification-proof" className="block text-xs font-semibold text-navy-800">
                Upload Verification Proof (CAC, MOE Approval, or Letterhead)
              </label>
              <input
                id="verification-proof"
                type="file"
                required
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
              <span className="block text-xs text-slate-500">Supported formats: PDF, PNG, JPG. Max 5MB.</span>
            </div>

            <button type="submit" className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800">
              Submit Claim Verification
            </button>
          </form>
        </div>
      ) : null}

      {flowState === 'new-school' ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8" id="new-school-form">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-navy-900">Register New School Profile</h2>
            <button type="button" onClick={resetFlow} className="text-xs text-slate-500 hover:underline">
              ← Back
            </button>
          </div>
          <p className="text-sm text-slate-500">Submit your school details to add it to the clearance directory.</p>

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
                placeholder="e.g. Springfield International School"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="school-area" className="block text-xs font-semibold text-navy-800">
                  LGA / Area
                </label>
                <input
                  id="school-area"
                  type="text"
                  required
                  placeholder="e.g. Alimosho"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="school-state" className="block text-xs font-semibold text-navy-800">
                  State
                </label>
                <input
                  id="school-state"
                  type="text"
                  required
                  placeholder="e.g. Lagos"
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="school-address" className="block text-xs font-semibold text-navy-800">
                School Physical Address
              </label>
              <input
                id="school-address"
                type="text"
                required
                placeholder="e.g. 15, Airport Road"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-clearance-phone" className="block text-xs font-semibold text-navy-800">
                School Official Clearance Phone Number
              </label>
              <input
                id="new-clearance-phone"
                type="tel"
                required
                placeholder="e.g. +234 803 123 4567"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-verification-proof" className="block text-xs font-semibold text-navy-800">
                Upload MOE License / CAC Proof
              </label>
              <input
                id="new-verification-proof"
                type="file"
                required
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>

            <button type="submit" className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800">
              Submit New Profile Request
            </button>
          </form>
        </div>
      ) : null}

      {flowState === 'pending' && pendingSubmission ? (
        <div className="space-y-6 rounded-2xl border border-background-secondary bg-white p-8 text-center shadow-sm" id="pending-page">
          <div className="inline-flex rounded-full border border-amber-100 bg-amber-50 p-4 text-amber-600">
            <svg className="h-12 w-12 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-navy-900">Registration Proof Under Review</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600">
              Our verification officers are reviewing your submission for <strong>{pendingSubmission.schoolName}</strong>. We will
              call you or email your proprietor account to confirm access within 24 hours.
            </p>
          </div>
          <div className="mx-auto max-w-sm rounded-lg border border-background-secondary bg-background p-4 text-left text-xs">
            <span className="mb-1 block font-semibold uppercase tracking-widest text-navy-900">What happens next?</span>
            <p className="text-slate-500">1. Verification email is sent to double-check school credentials.</p>
            <p className="mt-2 text-slate-500">
              2. Active school wallet will be initialized with a ₦5,000 promotional credit (50 free student checks).
            </p>
            <p className="mt-2 text-slate-500">
              3. To protect student privacy, your dashboard remains locked until your claim is approved.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/dashboard" className="inline-block rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">
              Go to Dashboard Demo (Simulate Approval)
            </Link>
          </div>
          <button type="button" onClick={resetFlow} className="mx-auto text-sm font-medium text-slate-500 hover:text-navy-900">
            Submit another {pendingSubmission.type === 'existing-school' ? 'claim' : 'school request'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
