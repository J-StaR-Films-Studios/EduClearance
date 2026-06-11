import type { Metadata } from 'next';
import Link from 'next/link';

import { AdminAccessRequired } from '@/components/admin/admin-access-required';
import { AdminAppShell } from '@/components/app/admin-app-shell';
import {
  adminOverviewMetrics,
  recentIssueSummaries,
  suspiciousAlerts,
} from '@/lib/demo-admin-data';
import { APP_NAME } from '@/lib/site';
import { isPlatformAdminSession } from '@/lib/demo-session';
import { noIndexMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = noIndexMetadata(`Admin Overview | ${APP_NAME}`, 'Private EduClearance platform admin overview.');

export default async function AdminOverviewPage() {
  const hasAccess = await isPlatformAdminSession();

  if (!hasAccess) {
    return <AdminAccessRequired />;
  }

  return (
    <AdminAppShell activeKey="overview">
      <header className="border-b border-background-secondary pb-4">
        <h1 className="text-2xl font-bold text-navy-900">Platform Operations Center</h1>
        <p className="text-xs text-slate-500">Monitor local clusters, verify claims, and inspect disputes</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {adminOverviewMetrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-background-secondary bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-slate-500">{metric.label}</p>
            <p
              className={cn(
                'mt-1 text-xl font-bold',
                metric.tone === 'warning'
                  ? 'text-amber-600'
                  : metric.tone === 'danger'
                    ? 'text-terracotta-600'
                    : 'text-navy-900',
              )}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-navy-900">Suspicious Activity Alerts</h3>
          <div className="divide-y divide-background-secondary">
            {suspiciousAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 py-3 text-xs">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 font-bold',
                    alert.tone === 'danger'
                      ? 'border-terracotta-100 bg-terracotta-50 text-terracotta-700'
                      : 'border-amber-100 bg-amber-50 text-amber-700',
                  )}
                >
                  {alert.type}
                </span>
                <div>
                  <p className="font-semibold text-navy-900">{alert.title}</p>
                  <p className="mt-0.5 text-slate-400">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-navy-900">Recent Pending Claims</h3>
          <div className="space-y-3">
            <div className="space-y-2 rounded-lg border border-background-secondary bg-background p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-900">Brightway College</span>
                <span className="font-mono text-slate-500">1 hour ago</span>
              </div>
              <p className="text-slate-600">Claimed pre-seeded profile. CAC document uploaded.</p>
              <Link href="/admin/schools" className="inline-block font-bold text-navy-900 hover:underline">
                Review Claim →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-background-secondary bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-background-secondary pb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Issue &amp; Clearance Snapshot</h3>
              <p className="text-xs text-slate-500">Operational overview across unresolved reports and paid checks</p>
            </div>
            <Link href="/admin/clearance" className="text-xs font-semibold text-navy-900 hover:underline">
              Open workspace
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recentIssueSummaries.map((issue) => (
              <div key={issue.id} className="rounded-xl border border-background-secondary bg-background p-4 text-xs">
                <p className="font-semibold text-navy-900">{issue.studentName}</p>
                <p className="mt-1 text-slate-500">{issue.reportingSchool}</p>
                <p className="mt-2 font-bold text-navy-900">{issue.amountLabel}</p>
                <p className="mt-1 text-slate-400">{issue.updatedAt}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-background-secondary bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-navy-900">Admin Quick Routes</h3>
          <div className="space-y-2 text-xs">
            <Link href="/admin/schools" className="block rounded-lg border border-background-secondary bg-background px-3 py-2 font-semibold text-navy-900 hover:bg-background-secondary">
              School approvals & contact edits
            </Link>
            <Link href="/admin/clearance" className="block rounded-lg border border-background-secondary bg-background px-3 py-2 font-semibold text-navy-900 hover:bg-background-secondary">
              Clearance monitoring & wallet controls
            </Link>
            <Link href="/admin/disputes" className="block rounded-lg border border-background-secondary bg-background px-3 py-2 font-semibold text-navy-900 hover:bg-background-secondary">
              Dispute resolution & refund helper
            </Link>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
