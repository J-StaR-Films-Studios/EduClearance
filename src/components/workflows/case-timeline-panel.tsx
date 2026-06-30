'use client';

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

export function CaseTimelinePanel({ title = 'Case timeline', entityType, entityId, entries, canComment = true }: CaseTimelinePanelProps) {
  const [timelineEntries, setTimelineEntries] = useState(entries);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const body = message.trim();
    const attachment = await readAttachment(form);

    if (!body && !attachment) {
      setNotice('Add a message or attach evidence before sending.');
      return;
    }

    if (attachment && attachment.size > MAX_TIMELINE_ATTACHMENT_BYTES) {
      setNotice('Attachment must be 2MB or smaller.');
      return;
    }

    setIsSubmitting(true);
    setNotice('');

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

    setIsSubmitting(false);

    if (!response.ok || !result?.ok || !result.entry) {
      setNotice(result?.message ?? 'Unable to add this timeline entry.');
      return;
    }

    setTimelineEntries((current) => [...current, result.entry!]);
    setMessage('');
    form.reset();
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
          {notice ? <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">{notice}</div> : null}
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-80">
            {isSubmitting ? 'Adding…' : 'Add to timeline'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
