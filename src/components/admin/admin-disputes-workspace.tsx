'use client';

import { useMemo, useState } from 'react';

import { adminDisputes, type AdminDisputeRecord } from '@/lib/local-admin-data';
import { cn } from '@/lib/utils';

type DisputeFilter = 'open' | 'all' | AdminDisputeRecord['status'];

export function AdminDisputesWorkspace() {
  const [records, setRecords] = useState(adminDisputes);
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

  function resolveDispute(record: AdminDisputeRecord, action: 'resolved' | 'rejected') {
    setRecords((currentRecords) =>
      currentRecords.map((entry) =>
        entry.id === record.id
          ? {
              ...entry,
              status: action,
              adminNote:
                action === 'resolved'
                  ? 'Record cleared after evidence review. Refund review noted for the admitting school wallet.'
                  : 'Dispute rejected after evidence review. Existing issue record remains active.',
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                'rounded-lg border px-3 py-2 text-xs font-semibold',
                filter === value ? 'border-navy-900 bg-navy-900 text-white' : 'border-background-secondary bg-white text-slate-600',
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
          className="w-full max-w-xs rounded-lg border border-background-secondary bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
        />
      </div>

      {notice ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-navy-900">Open Disputes Queue</h3>

          <div className="divide-y divide-background-secondary">
            {filteredRecords.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">No disputes match this filter.</div>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="space-y-2 py-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10px] font-semibold',
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
                    <span className="text-slate-400">{record.raisedAt}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-900">Dispute: {record.studentName} ({record.amountLabel})</p>
                    <p className="mt-1 text-slate-600">
                      Raised by: <strong>{record.raisedBySchool}</strong> (Admitting School)
                    </p>
                    <p className="text-slate-600">
                      Against: <strong>{record.reportingSchool}</strong> (Reporting School)
                    </p>
                    <p className="mt-2 rounded border border-background-secondary bg-background p-2 italic leading-relaxed text-slate-500">
                      Reason: &quot;{record.reason}&quot;
                    </p>
                    <p className="mt-2 rounded border border-background-secondary bg-white p-2 leading-relaxed text-slate-600">
                      Admin note: {record.adminNote}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    {record.refundReady ? (
                      <p className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-[11px] text-amber-700">
                        Note: Clearing this record marks a ₦100 wallet credit for refund review by an authorized operator.
                      </p>
                    ) : null}
                    {record.status === 'under_review' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => resolveDispute(record, 'resolved')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Clear Record (Resolve)
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveDispute(record, 'rejected')}
                          className="rounded-lg border border-background-secondary bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-background-secondary"
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

        <div className="space-y-3 rounded-2xl border border-background-secondary bg-white p-6 text-xs leading-relaxed shadow-sm">
          <h3 className="text-sm font-bold text-navy-900">Resolution Standard Protocol</h3>
          <p className="text-slate-500">1. Inspect admitting and reporting school comments before changing any live record.</p>
          <p className="text-slate-500">2. Request parent ledger receipts or bursary proof where necessary.</p>
          <p className="text-slate-500">3. Clearing an inaccurate record includes refund-review notes for the admitting school.</p>
          <p className="text-slate-500">4. Confirm audit logs and school notifications before closing the dispute.</p>
        </div>
      </div>
    </div>
  );
}
