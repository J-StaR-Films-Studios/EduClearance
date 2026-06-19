'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type AuthAccessFormProps = {
  mode: 'login' | 'register';
  audience?: 'school' | 'admin';
  destination?: string;
};

const formContent = {
  login: {
    school: {
      title: 'Sign In to EduClearance',
      description: 'Verify transfer clearances, manage issue reports, and monitor wallet activity.',
      buttonLabel: 'Sign In',
      pendingLabel: 'Opening workspace...',
      destination: '/auth/local-access?role=school_admin&redirect=%2Fdashboard',
      emailLabel: 'Official School Email',
    },
    admin: {
      title: 'Platform Admin Sign In',
      description: 'Review school claims, wallet operations, clearance cases, and disputes.',
      buttonLabel: 'Sign In',
      pendingLabel: 'Opening admin workspace...',
      destination: '/auth/local-access?role=platform_admin&redirect=%2Fadmin',
      emailLabel: 'Platform Admin Email',
    },
  },
  register: {
    title: 'Create School Account',
    description: 'Register a proprietor account to claim your school and manage clearance operations.',
    buttonLabel: 'Register Account',
    pendingLabel: 'Opening claim flow...',
    destination: '/claim-school',
  },
} as const;

export function AuthAccessForm({ mode, audience = 'school', destination }: AuthAccessFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginContent = {
    ...formContent.login[audience],
    destination: destination ?? formContent.login[audience].destination,
  };
  const registerContent = {
    ...formContent.register,
    destination: destination ?? formContent.register.destination,
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    setIsSubmitting(true);
    router.push(mode === 'login' ? loginContent.destination : registerContent.destination);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-background-secondary bg-white p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <div className="mb-2 inline-flex rounded-xl bg-navy-900 px-3 py-1.5 font-display text-lg font-bold tracking-wider text-white">
          EC
        </div>
        <h1 className="text-2xl font-bold text-navy-900">{mode === 'login' ? loginContent.title : registerContent.title}</h1>
        <p className="text-sm text-slate-500">{mode === 'login' ? loginContent.description : registerContent.description}</p>
      </div>

      {mode === 'login' ? (
        <>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-semibold text-navy-800">
                {loginContent.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="proprietor@yourschool.com"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-navy-800">
                  Password
                </label>
                <a href="#" className="text-xs text-slate-500 hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-90"
            >
              {isSubmitting ? loginContent.pendingLabel : loginContent.buttonLabel}
            </button>
          </form>

          <div className="mt-6 space-y-2 border-t border-background-secondary pt-4 text-center text-xs">
            {audience === 'school' ? (
              <>
                <p className="text-slate-500">
                  New school owner?{' '}
                  <Link href="/register" className="font-semibold text-navy-900 hover:underline">
                    Register an account
                  </Link>
                </p>
                <p className="text-slate-500">
                  Need to claim your school?{' '}
                  <Link href="/claim-school" className="font-semibold text-navy-900 hover:underline">
                    Claim pre-listed profile
                  </Link>
                </p>
                <p className="text-slate-400">
                  Local development access is enabled for protected school routes in this environment.
                </p>
                <p className="text-slate-400">
                  Are you a Platform Admin?{' '}
                  <Link href="/login?role=admin" className="font-semibold text-slate-500 hover:underline">
                    Go to Admin Login
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-500">
                  Need school access instead?{' '}
                  <Link href="/login" className="font-semibold text-navy-900 hover:underline">
                    Go to School Sign In
                  </Link>
                </p>
                <p className="text-slate-400">
                  Local development access is enabled for platform administration in this environment.
                </p>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="name" className="block text-xs font-semibold text-navy-800">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. Chief Mrs. Alabi"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="register-email" className="block text-xs font-semibold text-navy-800">
                Official Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                placeholder="proprietor@yourschool.com"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className="block text-xs font-semibold text-navy-800">
                Contact Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="e.g. +234 803 123 4567"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="register-password" className="block text-xs font-semibold text-navy-800">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                required
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-background-secondary bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
              />
            </div>

            <div className="flex items-start gap-2.5 py-1">
              <input
                id="consent"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-background-secondary text-navy-900 focus:ring-navy-800"
              />
              <label htmlFor="consent" className="text-xs leading-relaxed text-slate-500">
                I agree to the privacy statement and terms of school-to-school cluster network compliance.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-navy-900 py-3 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-90"
            >
              {isSubmitting ? registerContent.pendingLabel : registerContent.buttonLabel}
            </button>
          </form>

          <div className="mt-6 border-t border-background-secondary pt-4 text-center text-xs">
            <p className="text-slate-500">
              Already have a proprietor account?{' '}
              <Link href="/login" className="font-semibold text-navy-900 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
