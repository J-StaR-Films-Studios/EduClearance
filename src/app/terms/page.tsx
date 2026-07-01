import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'EduClearance school-to-school clearance network terms.',
};

export default function TermsPage() {
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
              EduClearance Terms
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
              EduClearance helps verified schools request and respond to student transfer clearance checks. Schools must submit accurate records, protect student and family privacy, and only report issues that match their official records.
            </p>
          </header>

          <div className="space-y-8 divide-y divide-background-secondary/60">
            <section className="space-y-2 pt-6 first:pt-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                School account responsibility
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                Account holders must be authorized representatives of their school. EduClearance may suspend access where submitted information is inaccurate, abusive, or unverifiable.
              </p>
            </section>

            <section className="space-y-2 pt-6">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                Clearance and issue reports
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                Schools must only create clearance requests and unresolved issue reports for legitimate admissions, transfer, or school-record purposes. False or retaliatory reports are prohibited.
              </p>
            </section>

            <section className="space-y-2 pt-6">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                Payments
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                Wallet top-ups are used for clearance checks. Payments are confirmed by server-side Paystack verification before wallet credit is added.
              </p>
            </section>

            <section className="space-y-2 pt-6">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900 tracking-tight break-words">
                Verification
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl break-words">
                School claims may require proof documents and official contact details. Submission does not guarantee approval. Admin review is required before a school profile becomes active.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
