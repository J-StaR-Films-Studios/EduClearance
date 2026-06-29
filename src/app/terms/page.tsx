import type { Metadata } from 'next';
import Link from 'next/link';

import { APP_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `Terms | ${APP_NAME}`,
  description: 'EduClearance school-to-school clearance network terms.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-navy-900">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-semibold text-navy-900 hover:underline">← Back home</Link>
        <h1 className="text-3xl font-bold">EduClearance Terms</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          EduClearance helps verified schools request and respond to student transfer clearance checks. Schools must submit accurate records, protect student and family privacy, and only report issues that match their official records.
        </p>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">School account responsibility</h2>
          <p className="text-sm leading-relaxed text-slate-600">Account holders must be authorized representatives of their school. EduClearance may suspend access where submitted information is inaccurate, abusive, or unverifiable.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">Clearance and issue reports</h2>
          <p className="text-sm leading-relaxed text-slate-600">Schools must only create clearance requests and unresolved issue reports for legitimate admissions, transfer, or school-record purposes. False or retaliatory reports are prohibited.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">Payments</h2>
          <p className="text-sm leading-relaxed text-slate-600">Wallet top-ups are used for clearance checks. Payments are confirmed by server-side Paystack verification before wallet credit is added.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">Verification</h2>
          <p className="text-sm leading-relaxed text-slate-600">School claims may require proof documents and official contact details. Submission does not guarantee approval. Admin review is required before a school profile becomes active.</p>
        </section>
      </article>
    </main>
  );
}
