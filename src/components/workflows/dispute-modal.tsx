'use client';

import { useState, type FormEvent } from 'react';

export function DisputeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    setSubmitted(true);
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-lg border border-terracotta-200 bg-white py-2.5 text-center text-xs font-medium text-terracotta-700 transition hover:bg-terracotta-50"
      >
        Flag Record / Open Dispute
      </button>

      {submitted ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
          Dispute submitted successfully. Platform administrators have been alerted for review.
        </div>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-navy-900">Raise Dispute Challenge</h4>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-navy-900">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Open a challenge for this record if the parent provides proof of payment or claims a duplicate. Platform admins will review both school records.
            </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="disputeReason" className="block text-xs font-semibold text-navy-800">
                  Reason for Dispute
                </label>
                <textarea
                  id="disputeReason"
                  required
                  rows={3}
                  placeholder="e.g. Parent has presented receipt number #4492 indicating full clearance on 2026-04-12."
                  className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 text-sm font-semibold">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-background-secondary px-4 py-2 transition hover:bg-background-secondary">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-white transition hover:bg-navy-800">
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
