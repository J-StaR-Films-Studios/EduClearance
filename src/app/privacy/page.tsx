import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'EduClearance privacy statement for school clearance data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8 text-navy-900 selection:bg-navy-100">
      <div className="mx-auto max-w-3xl bg-background-card rounded-2xl border border-background-secondary shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="h-1.5 w-full bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900" />
        <article className="p-6 sm:p-10 space-y-8">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 transition-colors hover:text-navy-800 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 rounded-sm"
            >
              <span className="inline-block transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span> 
              <span>Back home</span>
            </Link>
          </div>
          
          <header className="space-y-3 border-b border-background-secondary pb-6">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-900 break-words">
              Privacy Statement
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
              EduClearance processes school, student-transfer, wallet, and issue-report data so verified schools can run clearance checks responsibly.
            </p>
          </header>

          <div className="space-y-8 divide-y divide-background-secondary/60">
            <section className="space-y-2 pt-6 first:pt-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                Data we collect
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                We collect account details, school claim details, clearance request information, issue report information, wallet transactions, and audit logs required to operate the service.
              </p>
            </section>

            <section className="space-y-2 pt-6">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                How data is used
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                Data is used to verify school accounts, process clearance checks, display school-scoped records, prevent duplicate or abusive records, and support platform administration.
              </p>
            </section>

            <section className="space-y-2 pt-6">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                School responsibility
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                Schools are responsible for submitting accurate records and using clearance information only for legitimate admission and student-transfer purposes.
              </p>
            </section>

            <section className="space-y-2 pt-6">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                Proof documents
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                School claim proof documents are used for admin verification. Access is restricted to platform administrators.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
