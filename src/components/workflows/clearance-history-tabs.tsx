'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { type SchoolUserRole, withRoleQuery } from '@/lib/local-school-data';
import { formatNairaFromKobo } from '@/lib/money';
import { cn } from '@/lib/utils';

export type ClearanceHistoryOutbound = {
  id: string;
  studentName: string;
  previousSchoolName: string;
  resultState: 'no_record' | 'possible_match' | 'match' | 'cleared';
  statusLabel: string;
  amountChargedKobo: number;
};

export type ClearanceHistoryInbound = {
  id: string;
  studentName: string;
  requestingSchool: string;
  requestedAt: string;
  status: 'response_needed' | 'potential_response' | 'resolved';
};

type ClearanceHistoryTabsProps = {
  initialTab?: 'outbound' | 'inbound';
  role: SchoolUserRole;
  outboundClearances: ClearanceHistoryOutbound[];
  inboundRequests: ClearanceHistoryInbound[];
};

export function ClearanceHistoryTabs({ initialTab = 'outbound', role, outboundClearances, inboundRequests }: ClearanceHistoryTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'outbound' | 'inbound'>(initialTab);
  const [requests, setRequests] = useState(inboundRequests);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const activeInboundCount = useMemo(
    () => requests.filter((request) => request.status !== 'resolved').length,
    [requests],
  );

  async function markNoIssue(requestId: string) {
    setNotice('');
    setErrorMessage('');
    setUpdatingId(requestId);

    try {
      const response = await fetch('/api/clearance/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearanceRequestId: requestId, response: 'no_outstanding_issue' }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

      if (!response.ok || !result?.ok) {
        setErrorMessage(result?.message ?? 'Unable to record this response. Please try again.');
        return;
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId ? { ...request, status: 'resolved', requestedAt: `${request.requestedAt} · Responded` } : request,
        ),
      );
      setNotice('Cleared by previous school. No outstanding records remain.');
      router.refresh();
    } catch {
      setErrorMessage('Unable to record this response. Please try again.');
    } finally {
      setUpdatingId(null);
    }
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
        {errorMessage ? <div className="rounded-xl border border-terracotta-100 bg-terracotta-50 p-3 text-xs text-terracotta-700">{errorMessage}</div> : null}
      </div>

      {activeTab === 'outbound' ? (
        <div className="overflow-x-auto whitespace-normal">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                <th className="px-3 sm:px-6 py-3">Student</th>
                <th className="px-3 sm:px-6 py-3">Previous School</th>
                <th className="px-3 sm:px-6 py-3">Result</th>
                <th className="px-3 sm:px-6 py-3">Charged</th>
                <th className="px-3 sm:px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-secondary text-slate-600">
              {outboundClearances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-sm text-slate-500">
                    No clearance checks have been started yet.
                  </td>
                </tr>
              ) : outboundClearances.map((clearance) => (
                <tr key={clearance.id}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-navy-900 whitespace-normal break-words min-w-[120px] max-w-[180px] sm:max-w-none">
                    <Link href={withRoleQuery(`/clearance/${clearance.id}`, role)} className="hover:underline">
                      {clearance.studentName}
                    </Link>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal break-words min-w-[140px] max-w-[200px] sm:max-w-none">
                    <Link href={withRoleQuery(`/clearance/${clearance.id}`, role)} className="hover:underline">
                      {clearance.previousSchoolName}
                    </Link>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span
                      className={cn(
                        'inline-block rounded-md border px-1.5 py-0.5 text-[10px] leading-tight sm:text-xs font-semibold text-center whitespace-normal sm:whitespace-nowrap max-w-[150px] sm:max-w-none',
                        clearance.resultState === 'match'
                          ? 'border-terracotta-100 bg-terracotta-50 text-terracotta-600'
                          : clearance.resultState === 'no_record' || clearance.resultState === 'cleared'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                            : 'border-amber-100 bg-amber-50 text-amber-700',
                      )}
                    >
                      {clearance.statusLabel}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {formatNairaFromKobo(clearance.amountChargedKobo)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
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
            <div className="border-t border-background-secondary px-3 sm:px-6 py-8 text-sm text-slate-500">
              All inbound requests have a recorded response.
            </div>
          ) : null}
          <div className="overflow-x-auto whitespace-normal">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-background-secondary bg-background font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 sm:px-6 py-3">Student</th>
                  <th className="px-3 sm:px-6 py-3">Requesting School</th>
                  <th className="px-3 sm:px-6 py-3">Status</th>
                  <th className="px-3 sm:px-6 py-3">Requested</th>
                  <th className="px-3 sm:px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-secondary text-slate-600">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-sm text-slate-500">
                      No inbound clearance requests are assigned to your school.
                    </td>
                  </tr>
                ) : requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal break-words min-w-[120px] max-w-[180px] sm:max-w-none">
                      <Link href={withRoleQuery(`/clearance/${request.id}`, role)} className="font-semibold text-navy-900 hover:underline">
                        {request.status === 'potential_response' ? 'Potential student match' : request.studentName}
                      </Link>
                      <p className="mt-1 text-[10px] text-slate-400">View case history</p>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal break-words min-w-[140px] max-w-[200px] sm:max-w-none">
                      <Link href={withRoleQuery(`/clearance/${request.id}`, role)} className="hover:underline text-slate-600 hover:text-navy-900">
                        {request.requestingSchool}
                      </Link>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={cn(
                          'inline-block rounded-md border px-1.5 py-0.5 text-[10px] leading-tight sm:text-xs font-semibold text-center whitespace-normal sm:whitespace-nowrap max-w-[180px] sm:max-w-none',
                          request.status === 'resolved'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                            : request.status === 'potential_response'
                              ? 'border-amber-100 bg-amber-50 text-amber-700'
                              : 'border-terracotta-100 bg-terracotta-50 text-terracotta-700',
                        )}
                      >
                        {request.status === 'resolved' ? 'Cleared by previous school · no outstanding records remain' : request.status === 'potential_response' ? 'Potential match review' : 'Response needed'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal min-w-[90px]">
                      {request.requestedAt}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {request.status === 'resolved' ? (
                        <span className="inline-block rounded border border-emerald-100 bg-emerald-50/50 text-emerald-700 px-2 py-1 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                          Clearance recorded
                        </span>
                      ) : request.status === 'potential_response' ? (
                        <Link
                          href={withRoleQuery(`/clearance/${request.id}`, role)}
                          className="inline-block rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 text-[10px] sm:text-xs font-semibold text-center whitespace-normal sm:whitespace-nowrap transition-colors"
                        >
                          Review Match
                        </Link>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-1.5">
                          <button
                            type="button"
                            onClick={() => void markNoIssue(request.id)}
                            disabled={updatingId === request.id}
                            className="inline-block rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 text-[10px] sm:text-xs font-semibold text-center disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 whitespace-normal sm:whitespace-nowrap transition-colors"
                          >
                            {updatingId === request.id ? 'Recording…' : 'No Issue'}
                          </button>
                          <Link
                            href={withRoleQuery(`/issues/new?source=inbound&requestId=${encodeURIComponent(request.id)}`, role)}
                            className="inline-block rounded border border-terracotta-200 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-600 px-2 py-1 text-[10px] sm:text-xs font-semibold text-center whitespace-normal sm:whitespace-nowrap transition-colors"
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
