import Link from 'next/link';

const trustMarks = ['Grace Academy', 'Springfield International', 'Excel College', 'Hilltop Preparatory'];

const features = [
  {
    step: '1',
    title: 'Claim & Verify School',
    description:
      "Verify your school's identity to claim your profile. Once approved, you join your local area cluster network securely.",
  },
  {
    step: '2',
    title: 'Start Clearance Request',
    description:
      'For each incoming student, launch a paid verification request. The system searches for unresolved balances or pending obligations.',
  },
  {
    step: '3',
    title: 'Report Outstanding Issues',
    description:
      'Report outstanding obligations for departing students for free. Helps other cluster schools make informed decisions.',
  },
];

const pricingBullets = ['₦100 per student verification', 'Free unresolved issue reporting', 'Pay safely via Paystack'];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-navy-800">
      <nav className="sticky top-0 z-50 border-b border-background-secondary bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-navy-900 p-2 font-display text-lg font-bold tracking-wider text-white">EC</div>
            <span className="font-display text-xl font-bold tracking-tight text-navy-900">EduClearance</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-navy-900">
              How it Works
            </a>
            <a href="#pricing" className="hover:text-navy-900">
              Pricing
            </a>
            <a href="#safety" className="hover:text-navy-900">
              Trust & Privacy
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900">
              Sign In
            </Link>
            <Link href="/claim-school" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
              Claim Your School
            </Link>
          </div>
        </div>
      </nav>

      <header className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-16 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Private Local School Cluster Network
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-navy-900 sm:text-5xl md:text-6xl">
          Protect your school before admitting a new student
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl">
          A secure, private verification utility for Nigerian schools. Verify transfer clearance status, review outstanding
          obligations, and notify previous schools instantly.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <Link href="/claim-school" className="w-full rounded-lg bg-navy-900 px-8 py-3.5 text-center font-medium text-white shadow-sm hover:bg-navy-800 sm:w-auto">
            Claim Your School Profile
          </Link>
          <a href="#features" className="w-full rounded-lg border border-background-secondary bg-white px-8 py-3.5 text-center font-medium text-navy-900 hover:bg-background-secondary sm:w-auto">
            Learn How It Works
          </a>
        </div>
      </header>

      <section className="border-y border-background-secondary bg-background-secondary py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trusted by Local Proprietors Across Lagos & Abuja Clusters
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 select-none">
            {trustMarks.map((school) => (
              <span key={school} className="font-display text-lg font-bold tracking-wide text-navy-800">
                {school}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl space-y-16 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl font-bold text-navy-900">Structured Clearance, Not Public Shaming</h2>
          <p className="text-slate-600">
            EduClearance acts as a secure buffer to help clusters resolve student transfers with clear documentation.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="space-y-4 rounded-xl border border-background-secondary bg-white p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 text-lg font-bold text-navy-800">
                {feature.step}
              </div>
              <h3 className="text-xl font-semibold text-navy-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-background-secondary bg-white py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-bold text-navy-900">Simple, Transparent Pricing</h2>
            <p className="text-slate-600">
              Reporting issues is free. Top up your wallet to run clearance verification requests for incoming students.
            </p>
          </div>
          <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-background-secondary bg-background p-8 text-center">
            <h3 className="text-xl font-semibold text-navy-900">Clearance Verification Pack</h3>
            <div className="text-4xl font-bold text-navy-900">₦5,000</div>
            <p className="text-sm text-slate-500">Gives your school 50 student checks</p>
            <div className="mx-auto max-w-xs space-y-3 border-t border-background-secondary pt-4 text-left text-sm">
              {pricingBullets.map((bullet) => (
                <p key={bullet} className="flex items-center gap-2 text-slate-600">
                  <span className="font-bold text-emerald-600">✓</span>
                  {bullet}
                </p>
              ))}
            </div>
            <Link href="/claim-school" className="block rounded-lg bg-navy-900 py-3 font-semibold text-white hover:bg-navy-800">
              Claim School & Get Started
            </Link>
          </div>
        </div>
      </section>

      <section id="safety" className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 rounded-2xl bg-navy-900 p-8 text-white sm:p-12 md:flex-row md:p-16">
          <div className="max-w-xl space-y-4">
            <h2 className="text-3xl font-bold text-white">Built for Privacy & Cluster Trust</h2>
            <p className="text-sm leading-relaxed text-navy-100 sm:text-base">
              EduClearance is a private utility. Student records are never publicly searchable and are not indexed by search
              engines. All data access requires verification proof and platform admin authentication.
            </p>
          </div>
          <div className="max-w-xs flex-shrink-0 space-y-3 rounded-xl border border-white/10 bg-navy-800 p-6 text-xs">
            <div className="font-semibold uppercase tracking-[0.2em] text-emerald-600">Compliance Standards</div>
            <p className="leading-relaxed text-navy-100">1. Purpose-bound student tracking.</p>
            <p className="leading-relaxed text-navy-100">2. Complete dispute and resolution records.</p>
            <p className="leading-relaxed text-navy-100">3. Full audit logging of all checks.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-background-secondary bg-white py-12 text-center text-sm text-slate-500">
        <p className="mb-2 font-display font-semibold text-navy-900">EduClearance Network</p>
        <p>© 2026 EduClearance. All rights reserved. Private School-to-School Student Transfer Network.</p>
      </footer>
    </main>
  );
}
