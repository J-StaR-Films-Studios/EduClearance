'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const MAX_TIMELINE_ATTACHMENT_BYTES = 2_000_000;

type TimelineEntry = {
  id: string;
  entryType: string;
  body: string;
  authorLabel: string;
  createdAt: string;
  attachmentFileName: string | null;
  attachmentFileSize: number | null;
};

type CaseTimelinePanelProps = {
  title?: string;
  entityType: 'clearance_request' | 'clearance_issue' | 'dispute';
  entityId: string;
  entries: TimelineEntry[];
  canComment?: boolean;
  resolutionAction?: {
    issueId: string;
    initialResolved?: boolean;
  };
  blockedResolutionAction?: {
    reason: string;
  };
};

type AttachmentFile = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

function attachmentHref(entryId: string) {
  return `/api/case-timeline/attachment?entryId=${encodeURIComponent(entryId)}`;
}

function sizeLabel(size: number | null) {
  return size ? `${Math.ceil(size / 1024)} KB` : 'file';
}

function readAttachment(form: HTMLFormElement): Promise<AttachmentFile | null> {
  const input = form.elements.namedItem('attachmentFile');

  if (!(input instanceof HTMLInputElement) || input.type !== 'file') {
    return Promise.resolve(null);
  }

  const file = input.files?.[0];

  if (!file) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: String(reader.result ?? '') });
    reader.onerror = () => reject(new Error('Unable to read attachment file.'));
    reader.readAsDataURL(file);
  });
}

export function CaseTimelinePanel({ title = 'Case timeline', entityType, entityId, entries, canComment = true, resolutionAction, blockedResolutionAction }: CaseTimelinePanelProps) {
  const router = useRouter();
  const [timelineEntries, setTimelineEntries] = useState(entries);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldResolveIssue, setShouldResolveIssue] = useState(false);
  const [isResolved, setIsResolved] = useState(Boolean(resolutionAction?.initialResolved));

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const body = message.trim();
    const attachment = await readAttachment(form);

    if (!body && !attachment && !shouldResolveIssue) {
      setNotice('Add a message, attach evidence, or tick the confirmation checkbox before sending.');
      return;
    }

    if (attachment && attachment.size > MAX_TIMELINE_ATTACHMENT_BYTES) {
      setNotice('Attachment must be 2MB or smaller.');
      return;
    }

    setIsSubmitting(true);
    setNotice('');

    const newEntries: TimelineEntry[] = [];

    if (body || attachment) {
      const response = await fetch('/api/case-timeline/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          body: body || `Uploaded ${attachment?.name ?? 'evidence'}`,
          attachmentFileName: attachment?.name,
          attachmentFileType: attachment?.type,
          attachmentFileSize: attachment?.size,
          attachmentDataUrl: attachment?.dataUrl,
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; entry?: TimelineEntry } | null;

      if (!response.ok || !result?.ok || !result.entry) {
        setIsSubmitting(false);
        setNotice(result?.message ?? 'Unable to add this timeline entry.');
        return;
      }

      newEntries.push(result.entry);
    }

    if (shouldResolveIssue && resolutionAction && !isResolved) {
      const response = await fetch('/api/issues/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: resolutionAction.issueId, confirmed: true, note: body || undefined }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; alreadyResolved?: boolean; entry?: TimelineEntry } | null;

      if (!response.ok || !result?.ok) {
        setIsSubmitting(false);
        setNotice(result?.message ?? 'Unable to confirm payment/no outstanding issue.');
        return;
      }

      if (result.entry) {
        newEntries.push(result.entry);
      }
      setIsResolved(true);
      setShouldResolveIssue(false);
      setNotice(result.alreadyResolved ? 'This issue was already marked resolved.' : 'Timeline updated and the linked request was cleared.');
    }

    setIsSubmitting(false);

    if (newEntries.length > 0) {
      setTimelineEntries((current) => [...current, ...newEntries]);
    }
    setMessage('');
    form.reset();
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
      <div className="border-b border-background-secondary pb-4">
        <h2 className="text-lg font-bold text-navy-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">Messages, evidence, and status context for this student case.</p>
      </div>

      <div className="mt-4 space-y-3">
        {timelineEntries.length === 0 ? (
          <div className="rounded-xl border border-background-secondary bg-background p-4 text-sm text-slate-500">No timeline entries yet.</div>
        ) : timelineEntries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-background-secondary bg-background p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-900">{entry.authorLabel}</p>
              <p className="text-xs text-slate-400">{entry.entryType.replace('_', ' ')} · {entry.createdAt}</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-slate-600">{entry.body}</p>
            {entry.attachmentFileName ? (
              <a href={attachmentHref(entry.id)} target="_blank" className="mt-3 inline-flex rounded-lg border border-background-secondary bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-background-secondary">
                View evidence: {entry.attachmentFileName} ({sizeLabel(entry.attachmentFileSize)})
              </a>
            ) : null}
          </div>
        ))}
      </div>

      {canComment ? (
        <form className="mt-4 space-y-3 rounded-xl border border-background-secondary bg-background p-4" onSubmit={submitMessage}>
          <label className="block text-xs font-semibold text-navy-800" htmlFor={`timeline-message-${entityId}`}>
            Add message or evidence
          </label>
          <textarea
            id={`timeline-message-${entityId}`}
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
            placeholder="Add an update, request clarification, or explain uploaded evidence."
            className="w-full rounded-lg border border-background-secondary bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <input
            name="attachmentFile"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="w-full rounded-lg border border-background-secondary bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <p className="text-xs text-slate-500">Optional PDF, PNG, or JPG. Max 2MB.</p>
          {resolutionAction ? (
            <label className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">
              <input
                type="checkbox"
                checked={shouldResolveIssue || isResolved}
                disabled={isResolved}
                onChange={(event) => setShouldResolveIssue(event.currentTarget.checked)}
                className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-700"
              />
              <span>
                {isResolved
                  ? 'This issue has been confirmed resolved / no outstanding issue remains.'
                  : 'Also confirm payment received / no outstanding issue remains and clear the linked request.'}
              </span>
            </label>
          ) : blockedResolutionAction ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-relaxed text-emerald-800 opacity-80">
              <input
                type="checkbox"
                disabled
                className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-700"
              />
              <span className="flex-1">Confirm payment received / no outstanding issue remains and clear the linked request.</span>
              <details className="relative">
                <summary className="flex h-6 w-6 cursor-pointer list-none items-center justify-center rounded-full border border-emerald-200 bg-white text-[10px] font-bold text-emerald-700">
                  i
                </summary>
                <div className="absolute bottom-7 right-0 z-10 w-72 rounded-xl border border-background-secondary bg-white p-3 text-[11px] leading-relaxed text-slate-600 shadow-lg">
                  {blockedResolutionAction.reason}
                </div>
              </details>
            </div>
          ) : null}
          {notice ? <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">{notice}</div> : null}
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {isSubmitting ? 'Adding…' : shouldResolveIssue ? 'Add to timeline & clear issue' : 'Add to timeline'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
