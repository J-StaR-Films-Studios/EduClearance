import Link from 'next/link';

import { APP_NAME, SUPPORT_EMAIL } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Forgot Password | ${APP_NAME}`, 'Recover access to an EduClearance account.');

export default function ForgotPasswordPage() {
  const subject = encodeURIComponent('EduClearance password reset request');
  const body = encodeURIComponent('Hello EduClearance support,\n\nPlease help me reset access for this school account email:\n\nSchool name:\nAccount email:\nPhone number:\n');

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <section className="w-full max-w-md rounded-2xl border border-background-secondary bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mb-4 inline-flex rounded-xl bg-navy-900 px-3 py-1.5 font-display text-lg font-bold tracking-wider text-white">
          EC
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Reset your password</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          For launch security, password resets are verified manually by EduClearance support before account access is changed.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-navy-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-navy-800"
        >
          Email support to reset password
        </a>
        <p className="mt-4 text-xs text-slate-500">
          Support email: <span className="font-semibold text-navy-900">{SUPPORT_EMAIL}</span>
        </p>
        <Link href="/login" className="mt-6 inline-block text-xs font-semibold text-navy-900 hover:underline">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
