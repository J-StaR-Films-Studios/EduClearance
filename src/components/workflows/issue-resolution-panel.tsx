'use client';

import { useState } from 'react';

type IssueResolutionPanelProps = {
  issueId: string;
  initialResolved?: boolean;
};

export function IssueResolutionPanel({ issueId, initialResolved = false }: IssueResolutionPanelProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [isResolved, setIsResolved] = useState(initialResolved);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function resolveIssue() {
    if (!confirmed) {
      setMessage('Tick the confirmation box before approving this result.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const response = await fetch('/api/issues/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueId, confirmed: true, note: note.trim() || undefined }),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; alreadyResolved?: boolean } | null;

    setIsSubmitting(false);

    if (!response.ok || !result?.ok) {
      setMessage(result?.message ?? 'Unable to confirm this issue right now.');
      return;
    }

    setIsResolved(true);
    setMessage(result.alreadyResolved ? 'This issue was already marked resolved.' : 'Payment/no-outstanding confirmation saved. The linked clearance request is now cleared.');
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-bold text-navy-900">Confirm payment or no outstanding issue</h2>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800">
            Use this when your school has verified payment, resolved the record, or confirmed that no outstanding issue remains. If you do not tick the confirmation box, the case stays under review.
          </p>
        </div>
        {isResolved ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700">Resolved</span> : null}
      </div>

      {!isResolved ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            rows={2}
            placeholder="Optional note, e.g. Parent paid ₦50,000 and bursary confirmed receipt."
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <label className="flex items-start gap-2 text-xs leading-relaxed text-emerald-900">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.currentTarget.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-700"
            />
            I confirm this record is settled / no outstanding issue remains, and EduClearance may clear the linked request.
          </label>
          <button
            type="button"
            onClick={() => void resolveIssue()}
            disabled={isSubmitting || !confirmed}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Confirming…' : 'Confirm payment received / clear issue'}
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-3 rounded-lg bg-white p-3 text-xs text-emerald-800">{message}</p> : null}
    </section>
  );
}
