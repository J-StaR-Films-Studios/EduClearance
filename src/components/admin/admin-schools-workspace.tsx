'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

type SchoolStatus = 'unclaimed' | 'pending' | 'active' | 'suspended';
type SchoolClaimStatus = 'pending' | 'approved' | 'rejected';
type SchoolClaimType = 'existing_school' | 'new_school';

type AdminSchoolClaim = {
  id: string;
  schoolId: string | null;
  requestedSchoolName: string;
  requestedArea: string;
  requestedAddress: string;
  applicantName: string;
  applicantEmail: string;
  officialContactName: string;
  officialEmail: string;
  officialPhone: string;
  proofFileName: string;
  proofFileType: string | null;
  proofFileSize: number | null;
  hasProofFile: boolean;
  proofNote: string;
  type: SchoolClaimType;
  status: SchoolClaimStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  linkedSchoolName: string | null;
  linkedSchoolStatus: SchoolStatus | null;
};

type AdminSchoolsWorkspaceProps = {
  initialClaims: AdminSchoolClaim[];
};

const claimStatusLabels: Record<SchoolClaimStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const claimStatusStyles: Record<SchoolClaimStatus, string> = {
  pending: 'border border-amber-100 bg-amber-50 text-amber-700',
  approved: 'border border-emerald-100 bg-emerald-50 text-emerald-700',
  rejected: 'border border-terracotta-100 bg-terracotta-50 text-terracotta-700',
};

const claimTypeLabels: Record<SchoolClaimType, string> = {
  existing_school: 'Existing directory school',
  new_school: 'New school request',
};

export function AdminSchoolsWorkspace({ initialClaims }: AdminSchoolsWorkspaceProps) {
  const [claims, setClaims] = useState(initialClaims);
  const [activeTab, setActiveTab] = useState<SchoolClaimStatus>('pending');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedId, setSelectedId] = useState(initialClaims[0]?.id ?? '');
  const [reviewNote, setReviewNote] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();

    return claims.filter((claim) => {
      if (claim.status !== activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        claim.requestedSchoolName,
        claim.requestedArea,
        claim.requestedAddress,
        claim.applicantName,
        claim.applicantEmail,
        claim.officialContactName,
        claim.officialEmail,
        claim.officialPhone,
        claim.proofFileName,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [activeTab, claims, search]);

  const selectedClaim = claims.find((claim) => claim.id === selectedId) ?? filteredClaims[0] ?? claims[0] ?? null;

  useEffect(() => {
    setReviewNote(selectedClaim?.adminNote ?? '');
  }, [selectedClaim?.adminNote, selectedClaim?.id]);

  function updateClaim(claimId: string, updates: Partial<AdminSchoolClaim>, message: string) {
    setClaims((currentClaims) => currentClaims.map((claim) => (claim.id === claimId ? { ...claim, ...updates } : claim)));
    setNotice(message);
  }

  async function reviewClaim(claim: AdminSchoolClaim, action: 'approve' | 'reject') {
    setNotice('');

    const response = await fetch('/api/admin/school-claims/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: claim.id, action, adminNote: reviewNote }),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
      status?: SchoolClaimStatus;
      schoolId?: string | null;
      schoolStatus?: SchoolStatus | null;
    } | null;

    if (!response.ok || !result?.ok) {
      setNotice(result?.message ?? 'Unable to update this claim.');
      return;
    }

    const nextClaimUpdates: Partial<AdminSchoolClaim> = {
      status: result.status ?? (action === 'approve' ? 'approved' : 'rejected'),
      reviewedAt: new Date().toISOString(),
      adminNote: reviewNote.trim() || (action === 'reject' ? 'Claim rejected by platform admin.' : null),
    };

    if (action === 'approve') {
      nextClaimUpdates.schoolId = result.schoolId ?? claim.schoolId;
      nextClaimUpdates.linkedSchoolStatus = result.schoolStatus ?? claim.linkedSchoolStatus;
      nextClaimUpdates.linkedSchoolName = claim.linkedSchoolName ?? claim.requestedSchoolName;
    }

    updateClaim(claim.id, nextClaimUpdates, `${claim.requestedSchoolName}: ${action === 'approve' ? 'approved' : 'rejected'}.`);
  }

  async function saveLinkedSchoolProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClaim?.schoolId) {
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    setIsSavingProfile(true);

    const formData = new FormData(form);
    const payload = {
      schoolId: selectedClaim.schoolId,
      status: String(formData.get('schoolStatus') ?? selectedClaim.linkedSchoolStatus ?? 'active') as SchoolStatus,
      clearancePhone: String(formData.get('clearancePhone') ?? ''),
      contactEmail: String(formData.get('contactEmail') ?? ''),
      contactPerson: String(formData.get('contactPerson') ?? ''),
      adminNote: String(formData.get('adminNote') ?? ''),
    };

    const response = await fetch('/api/admin/schools/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    setIsSavingProfile(false);

    if (!response.ok || !result?.ok) {
      setNotice(result?.message ?? 'Unable to update the linked school profile.');
      return;
    }

    updateClaim(
      selectedClaim.id,
      {
        linkedSchoolStatus: payload.status,
        officialContactName: payload.contactPerson,
        officialEmail: payload.contactEmail,
        officialPhone: payload.clearancePhone,
        adminNote: payload.adminNote || selectedClaim.adminNote,
      },
      `${selectedClaim.requestedSchoolName}: linked school profile updated.`,
    );
  }

  const pendingCount = claims.filter((claim) => claim.status === 'pending').length;
  const approvedCount = claims.filter((claim) => claim.status === 'approved').length;
  const rejectedCount = claims.filter((claim) => claim.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 border-b border-background-secondary text-sm font-semibold">
          {([
            ['pending', 'Pending Review', pendingCount],
            ['approved', 'Approved Claims', approvedCount],
            ['rejected', 'Rejected Claims', rejectedCount],
          ] as const).map(([key, label, count]) => {
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  'px-4 py-2.5',
                  isActive ? 'border-b-2 border-navy-900 text-navy-900' : 'text-slate-500 hover:text-navy-900',
                )}
              >
                <span>{label}</span>
                <span className="ml-2 rounded-full bg-background-secondary px-1.5 py-0.5 text-[10px] font-bold text-navy-900">{count}</span>
              </button>
            );
          })}
        </div>

        <label className="block w-full max-w-sm">
          <span className="sr-only">Search claims</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search school, applicant, contact, or proof filename"
            className="w-full rounded-lg border border-background-secondary bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
        </label>
      </div>

      {notice ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-700">{notice}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-background-secondary bg-white shadow-sm">
        <div className="overflow-x-auto whitespace-nowrap">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">School / Request</th>
                <th className="px-6 py-3">Applicant</th>
                <th className="px-6 py-3">Official Contact</th>
                <th className="px-6 py-3">Proof Metadata</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-secondary text-slate-600">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No submitted claims match this filter yet.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className={cn(selectedClaim?.id === claim.id ? 'bg-background/60' : '')}>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => setSelectedId(claim.id)} className="text-left">
                        <p className="text-sm font-bold text-navy-900">{claim.requestedSchoolName}</p>
                        <p className="mt-0.5 text-slate-400">{claim.requestedArea}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">{claimTypeLabels[claim.type]}</p>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-800">{claim.applicantName}</p>
                      <p className="text-[10px] text-slate-400">{claim.applicantEmail}</p>
                      <p className="mt-1 text-[10px] text-slate-400">Submitted {claim.createdAt.slice(0, 10)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-900">{claim.officialContactName}</p>
                      <p className="text-[10px] text-slate-400">{claim.officialEmail}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{claim.officialPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-900">{claim.proofFileName}</p>
                      <p className="mt-1 line-clamp-3 whitespace-normal text-[10px] leading-relaxed text-slate-400">{claim.proofNote}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{claim.proofFileType ?? 'Uploaded proof'} · {claim.proofFileSize ? `${Math.ceil(claim.proofFileSize / 1024)} KB` : 'size unavailable'}</p>
                      {claim.hasProofFile ? (
                        <Link href={`/api/admin/school-claims/proof?claimId=${encodeURIComponent(claim.id)}`} target="_blank" className="mt-1 inline-flex text-[10px] font-semibold text-navy-900 underline">
                          View proof document
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        {claim.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void reviewClaim(claim, 'approve')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => void reviewClaim(claim, 'reject')}
                              className="rounded-lg border border-background-secondary bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-background-secondary"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedId(claim.id)}
                            className="rounded-lg border border-background-secondary bg-white px-3 py-1.5 font-semibold text-navy-900 transition hover:bg-background-secondary"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClaim ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-2 border-b border-background-secondary pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-900">Claim Review</h2>
                <p className="text-xs text-slate-500">Review proof metadata, then approve or reject. Approved claims can update the linked school profile below.</p>
              </div>
              <span className={cn('inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', claimStatusStyles[selectedClaim.status])}>
                {claimStatusLabels[selectedClaim.status]}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-background-secondary bg-background p-4 text-xs text-slate-500">
                <p className="font-semibold uppercase tracking-wider text-navy-900">Requested school</p>
                <p className="mt-2 text-sm font-semibold text-navy-900">{selectedClaim.requestedSchoolName}</p>
                <p className="mt-1">{selectedClaim.requestedArea}</p>
                <p className="mt-1">{selectedClaim.requestedAddress}</p>
              </div>
              <div className="rounded-xl border border-background-secondary bg-background p-4 text-xs text-slate-500">
                <p className="font-semibold uppercase tracking-wider text-navy-900">Applicant</p>
                <p className="mt-2 text-sm font-semibold text-navy-900">{selectedClaim.applicantName}</p>
                <p className="mt-1">{selectedClaim.applicantEmail}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-400">{claimTypeLabels[selectedClaim.type]}</p>
              </div>
              <div className="rounded-xl border border-background-secondary bg-background p-4 text-xs text-slate-500">
                <p className="font-semibold uppercase tracking-wider text-navy-900">Official contact</p>
                <p className="mt-2 text-sm font-semibold text-navy-900">{selectedClaim.officialContactName}</p>
                <p className="mt-1">{selectedClaim.officialEmail}</p>
                <p className="mt-1">{selectedClaim.officialPhone}</p>
              </div>
              <div className="rounded-xl border border-background-secondary bg-background p-4 text-xs text-slate-500">
                <p className="font-semibold uppercase tracking-wider text-navy-900">Proof document</p>
                <p className="mt-2 text-sm font-semibold text-navy-900">{selectedClaim.proofFileName}</p>
                <p className="mt-1 leading-relaxed">{selectedClaim.proofNote}</p>
                <p className="mt-2 text-slate-500">{selectedClaim.proofFileType ?? 'Uploaded proof'} · {selectedClaim.proofFileSize ? `${Math.ceil(selectedClaim.proofFileSize / 1024)} KB` : 'size unavailable'}</p>
                {selectedClaim.hasProofFile ? (
                  <Link href={`/api/admin/school-claims/proof?claimId=${encodeURIComponent(selectedClaim.id)}`} target="_blank" className="mt-2 inline-flex rounded-lg border border-background-secondary bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-background-secondary">
                    View proof document
                  </Link>
                ) : null}
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-400">Reviewed at: {selectedClaim.reviewedAt ?? 'Not yet reviewed'}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-background-secondary bg-background p-4">
              <label className="block text-xs font-semibold text-navy-800" htmlFor="review-note">
                Admin note
              </label>
              <textarea
                id="review-note"
                rows={4}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="Add approval guidance or rejection notes for the applicant."
                className="w-full rounded-lg border border-background-secondary bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void reviewClaim(selectedClaim, 'approve')}
                  disabled={selectedClaim.status !== 'pending'}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Approve claim
                </button>
                <button
                  type="button"
                  onClick={() => void reviewClaim(selectedClaim, 'reject')}
                  disabled={selectedClaim.status !== 'pending'}
                  className="rounded-lg border border-background-secondary bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reject claim
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-navy-900">Linked school profile</h3>
            {selectedClaim.schoolId ? (
              <form className="space-y-4" onSubmit={saveLinkedSchoolProfile}>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800" htmlFor="schoolStatus">
                    School Status
                  </label>
                  <select
                    id="schoolStatus"
                    name="schoolStatus"
                    defaultValue={selectedClaim.linkedSchoolStatus ?? 'active'}
                    className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                  >
                    <option value="unclaimed">Unclaimed</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800" htmlFor="contactPerson">
                    Contact Person
                  </label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    defaultValue={selectedClaim.officialContactName}
                    className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800" htmlFor="contactEmail">
                    Clearance Office Email
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    defaultValue={selectedClaim.officialEmail}
                    className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800" htmlFor="clearancePhone">
                    Official Clearance Phone
                  </label>
                  <input
                    id="clearancePhone"
                    name="clearancePhone"
                    defaultValue={selectedClaim.officialPhone}
                    className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800" htmlFor="adminNote">
                    Internal Admin Note
                  </label>
                  <textarea
                    id="adminNote"
                    name="adminNote"
                    rows={4}
                    defaultValue={selectedClaim.adminNote ?? ''}
                    className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-80"
                >
                  {isSavingProfile ? 'Saving…' : 'Save School Profile'}
                </button>
              </form>
            ) : (
              <div className="space-y-2 rounded-xl border border-background-secondary bg-background p-4 text-xs text-slate-500">
                <p className="font-semibold text-navy-900">No linked school yet</p>
                <p>This is a new school request. Approve it first to create the school profile, then update the linked profile here.</p>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-background-secondary bg-background p-4 text-xs leading-relaxed text-slate-500">
              <p className="font-semibold text-navy-900">Review checklist</p>
              <p>• Open the proof document and confirm it matches the contact details.</p>
              <p>• Approve existing schools only when the directory record is truly unclaimed.</p>
              <p>• New school requests will create a pending school profile after approval.</p>
              <p>• Update the linked school status from this panel when onboarding changes.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <Link href="/admin" className="font-semibold text-navy-900 hover:underline">
          Back to overview
        </Link>
        <span>•</span>
        <span>Submitted claims only — directory candidates stay in the public claim search.</span>
      </div>
    </div>
  );
}
