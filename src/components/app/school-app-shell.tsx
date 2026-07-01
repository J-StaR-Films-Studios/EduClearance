import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { type SchoolUserRole, withRoleQuery } from '@/lib/local-school-data';
import { resolveLocalSchoolActor } from '@/lib/local-actor';

export type SchoolAppShellNavKey = 'dashboard' | 'clearance-new' | 'clearance' | 'issues-new' | 'wallet';
export type SchoolAppShellMobileMode = 'default' | 'history' | 'detail';

type NavItem = {
  key: SchoolAppShellNavKey;
  href: string;
  label: string;
  mobileLabel: string;
  hidden?: boolean;
  locked?: boolean;
};

type SchoolAppShellProps = {
  activeKey: SchoolAppShellNavKey;
  mobileMode?: SchoolAppShellMobileMode;
  role?: SchoolUserRole;
  children: ReactNode;
};

const baseNavItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard', mobileLabel: 'Dashboard' },
  { key: 'clearance-new', href: '/clearance/new', label: 'Start Check (₦100)', mobileLabel: 'Verify (₦100)' },
  { key: 'clearance', href: '/clearance', label: 'Clearance History', mobileLabel: 'History' },
  { key: 'issues-new', href: '/issues/new', label: 'Report Issue (Free)', mobileLabel: 'Report Issue' },
  { key: 'wallet', href: '/wallet', label: 'Wallet & Billing', mobileLabel: 'Wallet' },
];

function iconForNav(key: SchoolAppShellNavKey) {
  switch (key) {
    case 'dashboard':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'clearance-new':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      );
    case 'clearance':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9m-5-4h5m0 0v5m0-5L10 14" />
        </svg>
      );
    case 'issues-new':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'wallet':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
  }
}

function getDesktopNavItems(role: SchoolUserRole) {
  return baseNavItems.filter((item) => {
    if (item.key === 'clearance') {
      return true;
    }

    return true;
  }).map((item) => {
    if (role === 'school_staff' && item.key === 'wallet') {
      return { ...item, locked: true };
    }

    return item;
  });
}

function getMobileNavItems(mode: SchoolAppShellMobileMode, role: SchoolUserRole) {
  if (mode === 'detail') {
    return [];
  }

  if (mode === 'history') {
    return baseNavItems.filter((item) => item.key !== 'issues-new' && (role !== 'school_staff' || item.key !== 'wallet'));
  }

  return baseNavItems.filter((item) => item.key !== 'clearance' && (role !== 'school_staff' || item.key !== 'wallet'));
}

export async function SchoolAppShell({ activeKey, mobileMode = 'default', role = 'school_admin', children }: SchoolAppShellProps) {
  const actor = await resolveLocalSchoolActor();
  const desktopNavItems = getDesktopNavItems(role);
  const mobileNavItems = getMobileNavItems(mobileMode, role);
  const schoolName = actor?.schoolName ?? 'School dashboard';
  const schoolStatus = actor?.schoolStatus ? actor.schoolStatus.charAt(0).toUpperCase() + actor.schoolStatus.slice(1) : 'Unknown';

  return (
    <div className="flex min-h-screen flex-col bg-background text-navy-800 md:flex-row">
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col space-y-8 overflow-y-auto border-r border-background-secondary bg-white p-6 md:flex">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-navy-900 p-2 font-display font-bold text-white">EC</div>
          <span className="font-display text-lg font-bold text-navy-900">EduClearance</span>
        </div>

        <nav className="flex-1 space-y-1.5">
          {desktopNavItems.map((item) => {
            const isActive = item.key === activeKey;

            if (item.locked) {
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-background-secondary px-4 py-2.5 text-sm text-slate-400"
                >
                  <span className="flex items-center gap-3">
                    {iconForNav(item.key)}
                    {item.label}
                  </span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Owner only
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={withRoleQuery(item.href, role)}
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

        <div className="border-t border-background-secondary pt-4 text-xs text-slate-400">
          <p className="font-medium text-slate-500">{schoolName}</p>
          <p className="mt-1 font-semibold text-navy-800">
            {role === 'school_staff' ? 'Role: School Staff' : `Verification: ${schoolStatus}`}
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Top Header / School Context */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-background-secondary bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-navy-900 p-1.5 font-display font-bold text-xs text-white">EC</div>
            <span className="font-display text-sm font-bold text-navy-900">EduClearance</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-slate-500 truncate max-w-[160px]" title={schoolName}>
              {schoolName}
            </p>
            <p className="text-[9px] font-semibold text-navy-800 mt-0.5">
              {role === 'school_staff' ? 'Role: School Staff' : `Verification: ${schoolStatus}`}
            </p>
          </div>
        </header>

        <main className={cn(
          'flex-1 px-4 pt-6 md:px-8 md:pb-8 md:pt-8',
          mobileNavItems.length > 0 ? 'pb-24' : 'pb-6'
        )}>
          {children}
        </main>
      </div>

      {mobileNavItems.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-background-secondary bg-white md:hidden">
          {mobileNavItems.map((item) => {
            const isActive = item.key === activeKey;

            return (
              <Link
                key={item.key}
                href={withRoleQuery(item.href, role)}
                className={cn(
                  'flex h-full flex-1 flex-col items-center justify-center py-1 transition-colors active:bg-slate-50',
                  isActive ? 'text-navy-900' : 'text-slate-500',
                )}
              >
                <div className="flex flex-col items-center justify-center">
                  {iconForNav(item.key)}
                  <span className={cn('mt-1 text-[10px] tracking-tight', isActive ? 'font-semibold' : 'font-medium')}>
                    {item.mobileLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

