'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { adminDisputes, type AdminDisputeRecord } from '@/lib/local-admin-data';
import { cn } from '@/lib/utils';

type DisputeFilter = 'open' | 'all' | AdminDisputeRecord['status'];

type AdminDisputesWorkspaceProps = {
  initialRecords?: AdminDisputeRecord[];
};

export function AdminDisputesWorkspace({ initialRecords = adminDisputes }: AdminDisputesWorkspaceProps) {
  const [records, setRecords] = useState(initialRecords);
  const [filter, setFilter] = useState<DisputeFilter>('open');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (filter === 'open' && record.status !== 'under_review') {
        return false;
      }

      if (filter !== 'open' && filter !== 'all' && record.status !== filter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [record.studentName, record.raisedBySchool, record.reportingSchool].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [filter, records, search]);

  async function resolveDispute(record: AdminDisputeRecord, action: 'resolved' | 'rejected') {
    const response = await fetch('/api/admin/disputes/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId: record.id, action }),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; adminNote?: string } | null;

    if (!response.ok || !result?.ok) {
      setNotice(result?.message ?? 'Unable to update dispute.');
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.map((entry) =>
        entry.id === record.id
          ? {
              ...entry,
              status: action,
              adminNote:
                action === 'resolved'
                  ? result.adminNote ?? 'Record cleared after evidence review. Refund review noted for the admitting school wallet.'
                  : result.adminNote ?? 'Dispute rejected after evidence review. Existing issue record remains active.',
            }
          : entry,
      ),
    );

    setNotice(
      action === 'resolved'
        ? `${record.studentName}: dispute resolved and the refund path has been noted for the admitting school.`
        : `${record.studentName}: dispute rejected and the existing issue record remains active.`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-background-secondary pb-4">
        <div className="flex flex-wrap gap-2">
          {([
            ['open', 'Open Queue'],
            ['all', 'All Disputes'],
            ['resolved', 'Resolved'],
            ['rejected', 'Rejected'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                filter === value ? 'border-navy-900 bg-navy-900 text-white' : 'border-background-secondary bg-white text-slate-600 hover:bg-background-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dispute by student or school"
          className="w-full sm:max-w-xs rounded-lg border border-background-secondary bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
        />
      </div>

      {notice ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-5 sm:p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-navy-900">Open Disputes Queue</h3>

          <div className="divide-y divide-background-secondary">
            {filteredRecords.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">No disputes match this filter.</div>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="space-y-3.5 py-4 text-xs">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span
                      className={cn(
                        'inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        record.status === 'resolved'
                          ? 'border-emerald-600/20 bg-emerald-50/40 text-emerald-700'
                          : record.status === 'rejected'
                            ? 'border-terracotta-600/20 bg-terracotta-50/40 text-terracotta-700'
                            : 'border-amber-600/20 bg-amber-50/40 text-amber-700',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-sm',
                          record.status === 'resolved'
                            ? 'bg-emerald-600'
                            : record.status === 'rejected'
                              ? 'bg-terracotta-600'
                              : 'bg-amber-600',
                        )}
                      />
                      {record.status === 'under_review'
                        ? 'Under Review'
                        : record.status === 'resolved'
                          ? 'Resolved'
                          : 'Rejected'}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{record.raisedAt}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-bold text-navy-900 break-words">Dispute: {record.studentName} ({record.amountLabel})</p>
                      <div className="flex items-center gap-2 text-[11px]">
                        {record.clearanceRequestId ? (
                          <Link href={`/clearance/${record.clearanceRequestId}`} className="font-semibold text-navy-900 underline hover:text-navy-700">
                            View case
                          </Link>
                        ) : null}
                        {record.clearanceIssueId ? (
                          <Link href={`/issues/${record.clearanceIssueId}`} className="font-semibold text-navy-900 underline hover:text-navy-700">
                            View issue
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-slate-600 break-words">
                      Raised by: <strong className="text-navy-900">{record.raisedBySchool}</strong> (Admitting School)
                    </p>
                    <p className="text-slate-600 break-words">
                      Against: <strong className="text-navy-900">{record.reportingSchool}</strong> (Reporting School)
                    </p>
                    <p className="mt-2 rounded-lg border border-background-secondary bg-background p-3 italic leading-relaxed text-slate-500 break-words">
                      Reason: &quot;{record.reason}&quot;
                    </p>
                    <p className="mt-2 rounded-lg border border-background-secondary bg-white p-3 leading-relaxed text-slate-600 break-words">
                      Admin note: {record.adminNote}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    {record.refundReady ? (
                      <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-[11px] text-amber-700 leading-relaxed">
                        Note: Clearing this record marks a ₦100 wallet credit for refund review by an authorized operator.
                      </p>
                    ) : null}
                    {record.status === 'under_review' ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => void resolveDispute(record, 'resolved')}
                          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 w-full sm:w-auto text-center"
                        >
                          Clear Record (Resolve)
                        </button>
                        <button
                          type="button"
                          onClick={() => void resolveDispute(record, 'rejected')}
                          className="rounded-lg border border-background-secondary bg-white px-4 py-2 font-semibold text-slate-600 transition hover:bg-background-secondary w-full sm:w-auto text-center"
                        >
                          Keep Record (Decline)
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-5 sm:p-6 text-xs leading-relaxed shadow-sm self-start">
          <h3 className="text-sm font-bold text-navy-900">Resolution Standard Protocol</h3>
          <p className="text-slate-500 border-l-2 border-navy-900/10 pl-2">• Inspect admitting and reporting school comments before changing any live record.</p>
          <p className="text-slate-500 border-l-2 border-navy-900/10 pl-2">• Request parent ledger receipts or bursary proof where necessary.</p>
          <p className="text-slate-500 border-l-2 border-navy-900/10 pl-2">• Clearing an inaccurate record includes refund-review notes for the admitting school.</p>
          <p className="text-slate-500 border-l-2 border-navy-900/10 pl-2">• Confirm audit logs and school notifications before closing the dispute.</p>
        </div>
      </div>
    </div>
  );
}
