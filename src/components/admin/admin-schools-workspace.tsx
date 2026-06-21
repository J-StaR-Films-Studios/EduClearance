'use client';

import { useMemo, useState } from 'react';

import { adminClaimSchools, type AdminClaimSchool } from '@/lib/local-admin-data';
import { cn } from '@/lib/utils';

type SchoolStatusFilter = 'pending' | 'active' | 'suspended';

type EditableFields = Pick<AdminClaimSchool, 'officialContact' | 'contactEmail' | 'contactPerson' | 'adminNote'>;

function getRowActions(status: AdminClaimSchool['status']) {
  if (status === 'pending') {
    return ['approve', 'decline'] as const;
  }

  if (status === 'active') {
    return ['suspend'] as const;
  }

  return ['reactivate'] as const;
}

type AdminSchoolsWorkspaceProps = {
  initialSchools?: AdminClaimSchool[];
};

export function AdminSchoolsWorkspace({ initialSchools = adminClaimSchools }: AdminSchoolsWorkspaceProps) {
  const [schools, setSchools] = useState(initialSchools);
  const [activeTab, setActiveTab] = useState<SchoolStatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedId, setSelectedId] = useState(initialSchools[0]?.id ?? '');

  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schools.filter((school) => {
      if (school.status !== activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [school.name, school.claimantName, school.claimantEmail, school.lga].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [activeTab, schools, search]);

  const selectedSchool = schools.find((school) => school.id === selectedId) ?? filteredSchools[0] ?? schools[0];

  function updateSchool(id: string, updates: Partial<AdminClaimSchool>, message: string) {
    setSchools((currentSchools) =>
      currentSchools.map((school) => (school.id === id ? { ...school, ...updates } : school)),
    );
    setNotice(message);
  }

  async function runLifecycleAction(school: AdminClaimSchool, action: 'approve' | 'decline' | 'suspend' | 'reactivate') {
    const nextStatus =
      action === 'approve' || action === 'reactivate'
        ? 'active'
        : action === 'suspend'
          ? 'suspended'
          : 'pending';

    const nextNote =
      action === 'decline'
        ? 'Claim declined. Follow-up documentation requested before approval can continue.'
        : school.adminNote;

    const response = await fetch('/api/admin/schools/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId: school.id, status: nextStatus, adminNote: nextNote }),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    if (!response.ok || !result?.ok) {
      setNotice(result?.message ?? 'Unable to update school profile.');
      return;
    }

    updateSchool(
      school.id,
      { status: nextStatus, adminNote: nextNote },
      `${school.name}: profile status updated to ${nextStatus}.`,
    );

    if (nextStatus !== activeTab) {
      setSelectedId('');
    }
  }

  async function saveProfileEdits(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSchool) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const updates: EditableFields = {
      officialContact: String(formData.get('officialContact') ?? ''),
      contactEmail: String(formData.get('contactEmail') ?? ''),
      contactPerson: String(formData.get('contactPerson') ?? ''),
      adminNote: String(formData.get('adminNote') ?? ''),
    };

    const response = await fetch('/api/admin/schools/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: selectedSchool.id,
        clearancePhone: updates.officialContact,
        contactEmail: updates.contactEmail,
        contactPerson: updates.contactPerson,
        adminNote: updates.adminNote,
      }),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    if (!response.ok || !result?.ok) {
      setNotice(result?.message ?? 'Unable to update school profile.');
      return;
    }

    updateSchool(selectedSchool.id, updates, `${selectedSchool.name}: official contact details updated.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex border-b border-background-secondary text-sm font-semibold">
          {([
            ['pending', 'Pending Verification'],
            ['active', 'Active Network'],
            ['suspended', 'Suspended Profiles'],
          ] as const).map(([key, label]) => {
            const count = schools.filter((school) => school.status === key).length;
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
                {key === 'pending' ? (
                  <span className="ml-2 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <label className="block w-full max-w-xs">
          <span className="sr-only">Search schools</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search school, claimant, or area"
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
                <th className="px-6 py-3">School Details</th>
                <th className="px-6 py-3">Claimed By</th>
                <th className="px-6 py-3">Contact Phone</th>
                <th className="px-6 py-3">Verification Document</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-secondary text-slate-600">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No schools match this filter yet.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => (
                  <tr key={school.id} className={cn(selectedSchool?.id === school.id ? 'bg-background/60' : '')}>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => setSelectedId(school.id)} className="text-left">
                        <p className="text-sm font-bold text-navy-900">{school.name}</p>
                        <p className="mt-0.5 text-slate-400">{school.lga}</p>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-800">{school.claimantName}</p>
                      <p className="text-[10px] text-slate-400">{school.claimantEmail}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy-900">{school.phone}</td>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => setSelectedId(school.id)} className="flex items-center gap-1.5 font-bold text-navy-900 hover:underline">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {school.documentName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        {getRowActions(school.status).map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => void runLifecycleAction(school, action)}
                            className={cn(
                              'rounded-lg px-3 py-1.5 font-semibold transition',
                              action === 'approve' || action === 'reactivate'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : action === 'suspend'
                                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                                  : 'border border-background-secondary bg-white text-slate-600 hover:bg-background-secondary',
                            )}
                          >
                            {action === 'approve'
                              ? 'Approve'
                              : action === 'decline'
                                ? 'Decline'
                                : action === 'suspend'
                                  ? 'Suspend'
                                  : 'Reactivate'}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSchool ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-2 border-b border-background-secondary pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-900">Official School Profile Review</h2>
                <p className="text-xs text-slate-500">Edit official clearance contact data and record admin notes.</p>
              </div>
              <span
                className={cn(
                  'inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                  selectedSchool.status === 'active'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : selectedSchool.status === 'suspended'
                      ? 'border-terracotta-100 bg-terracotta-50 text-terracotta-700'
                      : 'border-amber-100 bg-amber-50 text-amber-700',
                )}
              >
                {selectedSchool.status}
              </span>
            </div>

            <form className="mt-4 space-y-4" onSubmit={saveProfileEdits}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800" htmlFor="contactPerson">
                    Contact Person
                  </label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    defaultValue={selectedSchool.contactPerson}
                    className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800" htmlFor="officialContact">
                    Official Clearance Phone
                  </label>
                  <input
                    id="officialContact"
                    name="officialContact"
                    defaultValue={selectedSchool.officialContact}
                    className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-navy-800" htmlFor="contactEmail">
                  Clearance Office Email
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  defaultValue={selectedSchool.contactEmail}
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
                  defaultValue={selectedSchool.adminNote}
                  className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>

              <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800">
                Save Official Profile Update
              </button>
            </form>
          </div>

          <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 text-xs leading-relaxed shadow-sm">
            <h3 className="text-sm font-bold text-navy-900">Review Checklist</h3>
            <p className="text-slate-500">• Confirm school name and area match the existing directory profile.</p>
            <p className="text-slate-500">• Inspect uploaded documents before approval or reactivation.</p>
            <p className="text-slate-500">• Use suspension for abuse or unresolved identity concerns.</p>
            <p className="text-slate-500">• Confirm each lifecycle change has an audit trail before closing the review.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
