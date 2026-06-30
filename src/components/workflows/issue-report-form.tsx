'use client';

import { useState, type FormEvent } from 'react';

type InboundIssueRequest = {
  id: string;
  studentName: string;
  lastClass: string | null;
  parentName: string;
  parentPhone: string;
  requestingSchoolName: string;
  requestedAt: string;
};

export function IssueReportForm({ fromInboundRequest = false, inboundRequest = null }: { fromInboundRequest?: boolean; inboundRequest?: InboundIssueRequest | null }) {
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCertified, setIsCertified] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    if (!isCertified) {
      setErrorMessage('Please certify that the issue record is accurate before saving.');
      return;
    }

    const formData = new FormData(form);
    setSubmitted(false);
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/issues/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: String(formData.get('studentName') ?? '').trim(),
          lastClass: String(formData.get('lastClass') ?? '').trim(),
          issueType: String(formData.get('issueType') ?? 'other'),
          amountNaira: Number(formData.get('amountNaira') ?? 0),
          academicSession: String(formData.get('academicSession') ?? '').trim(),
          term: String(formData.get('term') ?? '').trim(),
          parentName: String(formData.get('parentName') ?? '').trim(),
          parentPhone: String(formData.get('parentPhone') ?? '').trim(),
          note: String(formData.get('note') ?? '').trim(),
          clearanceRequestId: inboundRequest?.id ?? null,
          source: fromInboundRequest ? 'inbound' : 'direct',
          certified: isCertified,
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; issues?: { fieldErrors?: Record<string, string[]> } } | null;

      if (!response.ok || !result?.ok) {
        setErrorMessage(result?.message ?? 'Unable to save issue report. Please try again.');
        return;
      }

      setSubmitted(true);
      form.reset();
      setIsCertified(false);
    } catch {
      setErrorMessage('Unable to save issue report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8">
      {submitted ? (
        <div className="mb-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-700">
          <p>Issue reported successfully. The record is marked unresolved and will remain available for school-scoped review and follow-up.</p>
          <a href="/issues" className="inline-flex font-semibold underline">
            View reported issues
          </a>
        </div>
      ) : null}

      {fromInboundRequest ? (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          {inboundRequest ? (
            <>
              <p className="font-semibold text-navy-900">Reporting against inbound request from {inboundRequest.requestingSchoolName}</p>
              <p className="mt-1">Student: {inboundRequest.studentName} · Parent: {inboundRequest.parentName} · Requested {inboundRequest.requestedAt.slice(0, 10)}</p>
              <p className="mt-1">This record will be linked to that clearance request, so the student context will not be lost.</p>
            </>
          ) : (
            <p>This report was opened from an inbound flow, but the original request was not found. You can still file a normal issue report.</p>
          )}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-terracotta-100 bg-terracotta-50 p-4 text-xs leading-relaxed text-terracotta-700">
          {errorMessage}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="issueStudentName" className="block text-xs font-semibold text-navy-800">
            Student&apos;s Full Name
          </label>
          <input
            id="issueStudentName"
            name="studentName"
            type="text"
            required
            defaultValue={inboundRequest?.studentName ?? ''}
            placeholder="e.g. Aisha Bello"
            className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="issueClass" className="block text-xs font-semibold text-navy-800">
              Last Class Attended
            </label>
            <select
              id="issueClass"
              name="lastClass"
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              defaultValue={inboundRequest?.lastClass ?? 'JSS 3'}
            >
              {inboundRequest?.lastClass ? <option>{inboundRequest.lastClass}</option> : null}
              <option>JSS 3</option>
              <option>Basic 6</option>
              <option>SSS 1</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="issueCategory" className="block text-xs font-semibold text-navy-800">
              Issue Category
            </label>
            <select
              id="issueCategory"
              name="issueType"
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              defaultValue="school_fees"
            >
              <option value="school_fees">Outstanding School Fees</option>
              <option value="books">Unreturned Books / Library</option>
              <option value="uniform">Unpaid Uniform / Materials</option>
              <option value="transport">Transport</option>
              <option value="other">Other Obligation</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="issueAmount" className="block text-xs font-semibold text-navy-800">
            Unresolved Balance Owed by Parent/Student (₦)
          </label>
          <input
            id="issueAmount"
            name="amountNaira"
            type="number"
            required
            min="1"
            placeholder="e.g. 45000"
            className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="academicSession" className="block text-xs font-semibold text-navy-800">
              Academic Session
            </label>
            <select
              id="academicSession"
              name="academicSession"
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              defaultValue="2025/2026"
            >
              <option>2025/2026</option>
              <option>2024/2025</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="academicTerm" className="block text-xs font-semibold text-navy-800">
              Academic Term
            </label>
            <select
              id="academicTerm"
              name="term"
              className="w-full rounded-lg border border-background-secondary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              defaultValue="2nd Term"
            >
              <option>1st Term</option>
              <option>2nd Term</option>
              <option>3rd Term</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="issueParentName" className="block text-xs font-semibold text-navy-800">
              Parent / Guardian Name
            </label>
            <input
              id="issueParentName"
              name="parentName"
              type="text"
              required
              defaultValue={inboundRequest?.parentName ?? ''}
              placeholder="e.g. Mr. Bello"
              className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="issuePhone" className="block text-xs font-semibold text-navy-800">
              Parent Contact Phone Number
            </label>
            <input
              id="issuePhone"
              name="parentPhone"
              type="tel"
              required
              defaultValue={inboundRequest?.parentPhone ?? ''}
              placeholder="e.g. +234 802 111 2222"
              className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="issueNote" className="block text-xs font-semibold text-navy-800">
            Official Note / Description
          </label>
          <textarea
            id="issueNote"
            name="note"
            required
            minLength={5}
            rows={3}
            placeholder="Outline tuition balances, contact attempts, and settlement milestones..."
            className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="issueEvidence" className="block text-xs font-semibold text-navy-800">
            Upload Supporting Evidence (Optional invoice, ledger printout, or bill)
          </label>
          <input
            id="issueEvidence"
            type="file"
            className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
        </div>

        <div className="flex items-start gap-2.5 py-2">
          <input
            id="ethicalCheck"
            type="checkbox"
            required
            checked={isCertified}
            onChange={(event) => setIsCertified(event.currentTarget.checked)}
            className="mt-0.5 h-4 w-4 rounded border-background-secondary text-navy-900 focus:ring-navy-800"
          />
          <label htmlFor="ethicalCheck" className="text-xs leading-relaxed text-slate-500">
            I certify under penalty of account suspension that this record is accurate, matches our physical accounts ledger, and complies with cluster data privacy policies.
          </label>
        </div>

        <button type="submit" disabled={isSubmitting || !isCertified} className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400">
          {isSubmitting ? 'Saving Issue…' : 'Save Unresolved Issue'}
        </button>
      </form>
    </div>
  );
}
