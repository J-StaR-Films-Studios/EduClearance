import Link from 'next/link';
import type { ReactNode } from 'react';

import { adminHref, type AdminNavKey } from '@/lib/local-admin-data';
import { cn } from '@/lib/utils';

const navItems: Array<{ key: AdminNavKey; href: ReturnType<typeof adminHref>; label: string }> = [
  { key: 'overview', href: adminHref('/admin'), label: 'Admin Overview' },
  { key: 'schools', href: adminHref('/admin/schools'), label: 'School Approvals' },
  { key: 'clearance', href: adminHref('/admin/clearance'), label: 'Global Clearances' },
  { key: 'disputes', href: adminHref('/admin/disputes'), label: 'Platform Disputes' },
];

type AdminAppShellProps = {
  activeKey: AdminNavKey;
  children: ReactNode;
};

function iconForNav(key: AdminNavKey) {
  switch (key) {
    case 'overview':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'schools':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'clearance':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case 'disputes':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
  }
}

export function AdminAppShell({ activeKey, children }: AdminAppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-navy-800 md:flex-row">
      <aside className="hidden min-h-screen w-64 flex-shrink-0 flex-col space-y-8 border-r border-background-secondary bg-white p-6 md:flex">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-navy-900 p-2 font-display font-bold text-white">EC</div>
          <span className="font-display text-lg font-bold text-navy-900">EduClearance Admin</span>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.key === activeKey;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition',
                  isActive ? 'bg-background-secondary font-semibold text-navy-900' : 'font-medium text-slate-600 hover:text-navy-900',
                )}
              >
                {iconForNav(item.key)}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1">
        <div className="border-b border-background-secondary bg-white px-4 py-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-navy-900 p-2 font-display font-bold text-white">EC</div>
            <span className="font-display text-base font-bold text-navy-900">EduClearance Admin</span>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
            {navItems.map((item) => {
              const isActive = item.key === activeKey;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-semibold',
                    isActive
                      ? 'border-background-secondary bg-background-secondary text-navy-900'
                      : 'border-background-secondary bg-white text-slate-600',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
