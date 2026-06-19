'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  inboundRequests,
  outboundClearances,
  type SchoolUserRole,
  withRoleQuery,
} from '@/lib/local-school-data';
import { formatNairaFromKobo } from '@/lib/money';
import { cn } from '@/lib/utils';

type ClearanceHistoryTabsProps = {
  initialTab?: 'outbound' | 'inbound';
  role: SchoolUserRole;
};

export function ClearanceHistoryTabs({ initialTab = 'outbound', role }: ClearanceHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<'outbound' | 'inbound'>(initialTab);
  const [requests, setRequests] = useState(inboundRequests);
  const [notice, setNotice] = useState('');

  const activeInboundCount = useMemo(
    () => requests.filter((request) => request.status === 'response_needed').length,
    [requests],
  );

  function markNoIssue(requestId: string) {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status: 'resolved', requestedAt: `${request.requestedAt} · Responded` } : request,
      ),
    );
    setNotice('Inbound clearance request updated to “No Outstanding Issue”. In production, this will be audit logged server-side.');
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-background-secondary bg-white shadow-sm">
      <div className="space-y-4 border-b border-background-secondary p-4 sm:p-6">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Clearance history tabs">
          <button
            type="button"
            onClick={() => setActiveTab('outbound')}
            className={cn(
              'rounded-lg px-4 py-2 text-xs font-semibold',
              activeTab === 'outbound' ? 'bg-navy-900 text-white' : 'border border-background-secondary bg-background text-slate-600',
            )}
          >
            Checks Initiated (Outbound)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbound')}
            className={cn(
              'rounded-lg px-4 py-2 text-xs font-semibold',
              activeTab === 'inbound' ? 'bg-navy-900 text-white' : 'border border-background-secondary bg-background text-slate-600',
            )}
          >
            Clearances Requested (Inbound)
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Inbound requests must be answered carefully. Confirm only whether there is an unresolved issue; do not expose unnecessary student data.
        </p>
        {notice ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</div> : null}
      </div>

      {activeTab === 'outbound' ? (
        <div className="overflow-x-auto whitespace-nowrap">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Previous School</th>
                <th className="px-6 py-3">Result</th>
                <th className="px-6 py-3">Charged</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-secondary text-slate-600">
              {outboundClearances.map((clearance) => (
                <tr key={clearance.id}>
                  <td className="px-6 py-4 font-semibold text-navy-900">{clearance.studentName}</td>
                  <td className="px-6 py-4">{clearance.previousSchoolName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 font-semibold',
                        clearance.resultState === 'match'
                          ? 'border-terracotta-100 bg-terracotta-50 text-terracotta-600'
                          : 'border-amber-100 bg-amber-50 text-amber-700',
                      )}
                    >
                      {clearance.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatNairaFromKobo(clearance.amountChargedKobo)}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={withRoleQuery(`/clearance/${clearance.id}`, role)}
                      className="font-semibold text-navy-900 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {activeInboundCount === 0 ? (
            <div className="border-t border-background-secondary px-6 py-8 text-sm text-slate-500">
              All inbound requests have a recorded response.
            </div>
          ) : null}
          <div className="overflow-x-auto whitespace-nowrap">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Requesting School</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Requested</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-secondary text-slate-600">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 font-semibold text-navy-900">{request.studentName}</td>
                    <td className="px-6 py-4">{request.requestingSchool}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 font-semibold',
                          request.status === 'resolved'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                            : 'border-amber-100 bg-amber-50 text-amber-700',
                        )}
                      >
                        {request.status === 'resolved' ? 'No outstanding issue confirmed' : 'Response needed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{request.requestedAt}</td>
                    <td className="px-6 py-4">
                      {request.status === 'resolved' ? (
                        <span className="font-medium text-slate-500">Response recorded</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => markNoIssue(request.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white"
                          >
                            No Outstanding Issue
                          </button>
                          <Link
                            href={withRoleQuery('/issues/new?source=inbound', role)}
                            className="rounded-lg border border-background-secondary bg-white px-3 py-1.5 font-semibold text-navy-900"
                          >
                            Report Issue
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
