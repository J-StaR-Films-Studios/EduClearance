'use client';

import { useMemo, useState, type FormEvent } from 'react';

import {
  adminClearanceRecords,
  recentIssueSummaries,
  walletWatchSchools,
  type AdminClearanceRecord,
} from '@/lib/local-admin-data';
import { cn } from '@/lib/utils';

type ClearanceStatusFilter = 'all' | AdminClearanceRecord['status'];

function statusChip(status: AdminClearanceRecord['status']) {
  switch (status) {
    case 'no_record':
      return 'No Record';
    case 'owed_balance':
      return 'Owed Balance';
    case 'disputed':
      return 'Disputed';
    case 'no_response':
      return 'No Response';
  }
}

export function AdminClearanceWorkspace() {
  const [records] = useState(adminClearanceRecords);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClearanceStatusFilter>('all');
  const [notice, setNotice] = useState('');

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [record.studentName, record.admittingSchool, record.previousSchool].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [records, search, statusFilter]);

  function adjustWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const schoolName = String(formData.get('school') ?? 'Selected school');
    const adjustmentType = String(formData.get('type') ?? 'Credit');
    const amount = String(formData.get('amount') ?? '0');
    const reason = String(formData.get('reason') ?? 'No reason provided');

    setNotice(
      `${schoolName}: ${adjustmentType.toLowerCase()} of ₦${Number(amount).toLocaleString('en-NG')} recorded for local review as provider=manual. Wallet transaction and audit logging should persist this action when live admin controls are connected. Reason: ${reason}`,
    );
    form.reset();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-navy-900">Global Clearance Logs</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student or school"
              className="rounded-lg border border-background-secondary bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ClearanceStatusFilter)}
              className="rounded-lg border border-background-secondary bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
            >
              <option value="all">All statuses</option>
              <option value="no_record">No record</option>
              <option value="owed_balance">Owed balance</option>
              <option value="disputed">Disputed</option>
              <option value="no_response">No response</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto whitespace-nowrap">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-background-secondary bg-background font-bold uppercase text-slate-500">
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Admitting School</th>
                <th className="px-4 py-2">Previous School</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-secondary text-slate-600">
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 font-semibold text-navy-900">{record.studentName}</td>
                  <td className="px-4 py-3">{record.admittingSchool}</td>
                  <td className="px-4 py-3">{record.previousSchool}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10px] font-semibold',
                        record.status === 'no_record'
                          ? 'border-emerald-600/20 bg-emerald-50/40 text-emerald-700'
                          : record.status === 'owed_balance'
                            ? 'border-terracotta-600/20 bg-terracotta-50/40 text-terracotta-700'
                            : 'border-amber-600/20 bg-amber-50/40 text-amber-700',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-sm',
                          record.status === 'no_record'
                            ? 'bg-emerald-600'
                            : record.status === 'owed_balance'
                              ? 'bg-terracotta-600'
                              : 'bg-amber-600',
                        )}
                      />
                      {statusChip(record.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{record.checkedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-background-secondary pt-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-background-secondary bg-background p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">Recent unresolved issue reports</h4>
            <div className="space-y-3 text-xs">
              {recentIssueSummaries.map((issue) => (
                <div key={issue.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{issue.studentName}</p>
                    <p className="text-slate-500">{issue.reportingSchool}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-navy-900">{issue.amountLabel}</p>
                    <p className="text-slate-400">{issue.updatedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-background-secondary bg-background p-4 text-xs leading-relaxed">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">Operational hints</h4>
            <p className="text-slate-500">• Use this workspace to monitor paid clearance requests and compare issue trends across schools.</p>
            <p className="text-slate-500">• Manual credits or debits should remain clearly marked as provider=manual.</p>
            <p className="text-slate-500">• Refund helpers for inaccurate dispute outcomes should add a ₦100 wallet credit back to the admitting school.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-navy-900">Manual Wallet Adjustment</h3>
        <p className="text-xs text-slate-500">Platform admin tool to adjust school credits. All manual adjustments must be audit logged.</p>

        {notice ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</div> : null}

        <form className="space-y-3" onSubmit={adjustWallet}>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-navy-800" htmlFor="wallet-school">
              Select Target School
            </label>
            <select id="wallet-school" name="school" required className="w-full rounded-lg border border-background-secondary bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800">
              <option>Grace Academy (Ikeja)</option>
              <option>Hilltop Preparatory (Gbagada)</option>
              <option>Brightway College (Alimosho)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-navy-800" htmlFor="wallet-type">
                Type
              </label>
              <select id="wallet-type" name="type" className="w-full rounded-lg border border-background-secondary bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800">
                <option>Credit</option>
                <option>Debit</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-navy-800" htmlFor="wallet-amount">
                Amount (₦)
              </label>
              <input
                id="wallet-amount"
                name="amount"
                type="number"
                min="1"
                required
                placeholder="5000"
                className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-navy-800" htmlFor="wallet-reason">
              Adjustment Reason
            </label>
            <input
              id="wallet-reason"
              name="reason"
              type="text"
              required
              placeholder="e.g. Offline payment resolution or approved refund"
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-800"
            />
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
            Refund helper note: clearing an inaccurate dispute should post a separate ₦100 credit refund for the admitting school.
          </div>

          <button type="submit" className="w-full rounded-lg bg-navy-900 py-2.5 text-xs font-medium text-white transition hover:bg-navy-800">
            Apply Balance Adjustment
          </button>
        </form>

        <div className="space-y-3 border-t border-background-secondary pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">Wallet watchlist</h4>
          {walletWatchSchools.map((school) => (
            <div key={school.id} className="rounded-xl border border-background-secondary bg-background p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-navy-900">{school.schoolName}</p>
                <p className="font-bold text-navy-900">{school.balanceLabel}</p>
              </div>
              <p className="mt-1 text-slate-500">{school.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
