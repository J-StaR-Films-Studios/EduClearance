import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'EduClearance privacy statement for school clearance data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-navy-900">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-semibold text-navy-900 hover:underline">← Back home</Link>
        <h1 className="text-3xl font-bold">Privacy Statement</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          EduClearance processes school, student-transfer, wallet, and issue-report data so verified schools can run clearance checks responsibly.
        </p>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">Data we collect</h2>
          <p className="text-sm leading-relaxed text-slate-600">We collect account details, school claim details, clearance request information, issue report information, wallet transactions, and audit logs required to operate the service.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">How data is used</h2>
          <p className="text-sm leading-relaxed text-slate-600">Data is used to verify school accounts, process clearance checks, display school-scoped records, prevent duplicate or abusive records, and support platform administration.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">School responsibility</h2>
          <p className="text-sm leading-relaxed text-slate-600">Schools are responsible for submitting accurate records and using clearance information only for legitimate admission and student-transfer purposes.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold">Proof documents</h2>
          <p className="text-sm leading-relaxed text-slate-600">School claim proof documents are used for admin verification. Access is restricted to platform administrators.</p>
        </section>
      </article>
    </main>
  );
}
