import type { Metadata } from 'next';
import Link from 'next/link';

import { buildHomepageStructuredData } from '@/lib/seo';
import { APP_KEYWORDS, APP_NAME, OG_IMAGE_PATH } from '@/lib/site';

const homepageDescription =
  'Run private student transfer clearance checks, report unresolved issues, and coordinate school-to-school verification workflows across Nigerian admissions teams.';

const features = [
  {
    step: '1',
    title: 'Verify School Access',
    description:
      'Confirm your school identity before opening clearance workflows so only approved operators can access sensitive student transfer records.',
  },
  {
    step: '2',
    title: 'Start Transfer Checks',
    description:
      'Open a paid clearance request for each incoming student and review whether any unresolved obligation has already been reported.',
  },
  {
    step: '3',
    title: 'Resolve Issues Professionally',
    description:
      'Notify previous schools, report unresolved balances, and keep dispute-ready records without public exposure or shame-based language.',
  },
];

const networkHighlights = [
  {
    title: 'Private school access',
    description: 'Protected routes are reserved for verified school accounts and authorized platform operators.',
  },
  {
    title: 'Purpose-built admissions workflow',
    description: 'Manage claim review, paid transfer checks, unresolved issue reporting, and wallet credits in one operational flow.',
  },
  {
    title: 'Search-safe by design',
    description: 'Sensitive school workspaces and student-transfer pages stay out of search indexing and public discovery.',
  },
];

const pricingBullets = ['₦100 per student verification', 'Free unresolved issue reporting', 'Pay securely online'];

const structuredData = buildHomepageStructuredData();

export const metadata: Metadata = {
  title: 'Student transfer clearance network for Nigerian schools',
  description: homepageDescription,
  keywords: [...APP_KEYWORDS],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `Student transfer clearance network for Nigerian schools | ${APP_NAME}`,
    description: homepageDescription,
    url: '/',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} homepage preview`,
      },
    ],
  },
  twitter: {
    title: `Student transfer clearance network for Nigerian schools | ${APP_NAME}`,
    description: homepageDescription,
    images: [OG_IMAGE_PATH],
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-navy-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

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
          Private school-to-school verification network
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-navy-900 sm:text-5xl md:text-6xl">
          Protect your school before admitting a new student
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl">
          EduClearance helps Nigerian schools run transfer clearance checks, review unresolved obligations, and contact previous
          schools through a private, professional workflow.
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
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operational highlights</p>
            <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Built for private admissions and transfer-clearance operations</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {networkHighlights.map((highlight) => (
              <article key={highlight.title} className="rounded-2xl border border-white/70 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-navy-900">{highlight.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{highlight.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl space-y-16 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl font-bold text-navy-900">Structured clearance, not public shaming</h2>
          <p className="text-slate-600">
            EduClearance gives admitting and previous schools a secure workflow for transfer verification, issue reporting, and
            professional follow-up.
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
            <h2 className="text-3xl font-bold text-navy-900">Simple, transparent pricing</h2>
            <p className="text-slate-600">
              Reporting issues is free. Top up your wallet to run clearance verification requests for incoming students.
            </p>
          </div>
          <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-background-secondary bg-background p-8 text-center">
            <h3 className="text-xl font-semibold text-navy-900">Clearance verification pack</h3>
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
            <h2 className="text-3xl font-bold text-white">Built for privacy and accountable follow-up</h2>
            <p className="text-sm leading-relaxed text-navy-100 sm:text-base">
              EduClearance is a private utility for school operators. Student records are never publicly searchable and protected
              workflows are excluded from search discovery.
            </p>
          </div>
          <div className="max-w-xs flex-shrink-0 space-y-3 rounded-xl border border-white/10 bg-navy-800 p-6 text-xs">
            <div className="font-semibold uppercase tracking-[0.2em] text-emerald-600">Operational standards</div>
            <p className="leading-relaxed text-navy-100">1. Purpose-bound student transfer verification.</p>
            <p className="leading-relaxed text-navy-100">2. Complete dispute and resolution records.</p>
            <p className="leading-relaxed text-navy-100">3. Controlled access for verified school users.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-background-secondary bg-white py-12 text-center text-sm text-slate-500">
        <p className="mb-2 font-display font-semibold text-navy-900">EduClearance Network</p>
        <p>© 2026 EduClearance. All rights reserved. Private school-to-school student transfer clearance network.</p>
      </footer>
    </main>
  );
}
