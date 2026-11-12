'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building,
  Receipt,
  FileText,
  RefreshCw,
  ShieldAlert,
  Activity,
  AlertTriangle,
  Search,
  Sparkles,
  Lock,
  Globe,
  Mic,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';
import { formatCurrency } from '@/engine/calculator';
import { getCurrencyFlag } from '@/lib/currencies';
import type { PlatformAdminOverview, PlatformUserMonitorRow } from '@/services/admin-service';
import {
  ADMIN_MONITOR_REFRESH_INTERVAL_MS,
  formatCompactTokens,
  formatDurationCompact,
  type DailyActivityPoint,
} from '@/lib/admin-metrics';

type UserFilterTab = 'all' | 'active_7d' | 'with_invoices' | 'admins';

function formatShortDate(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never signed in';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '—';
  const diffMinutes = Math.floor((Date.now() - ts) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatShortDate(iso);
}

function DailyBarTrend({
  title,
  subtitle,
  points,
  barClassName,
}: {
  title: string;
  subtitle: string;
  points: DailyActivityPoint[];
  barClassName: string;
}) {
  const maxVal = Math.max(1, ...points.map((p) => p.count));
  const totalCount = points.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
          {totalCount} total
        </span>
      </div>

      <div className="flex items-end gap-1.5 h-28 pt-2">
        {points.map((point) => {
          const heightPct = Math.max(8, Math.round((point.count / maxVal) * 100));
          return (
            <div
              key={point.date}
              title={`${point.label}: ${point.count}`}
              className="flex-1 flex flex-col items-center justify-end h-full group"
            >
              <div className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                {point.count}
              </div>
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-md transition-all ${
                  point.count > 0 ? barClassName : 'bg-slate-100'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
        <span>{points[0]?.label || ''}</span>
        <span>{points[Math.floor(points.length / 2)]?.label || ''}</span>
        <span>{points[points.length - 1]?.label || 'Today'}</span>
      </div>
    </div>
  );
}

export default function PlatformAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<PlatformAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<UserFilterTab>('all');
  const [confirmRoleUserId, setConfirmRoleUserId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchOverview = async (options?: { background?: boolean }) => {
    const isBackground = Boolean(options?.background);
    try {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }
      const data = await fetchJsonWithBuffer('/api/admin/overview', {
        timeoutMs: 15000,
        retry: true,
      });
      if (data.success && data.overview) {
        setOverview(data.overview);
        setError(null);
      } else if (!isBackground) {
        setError(data.error || 'Failed to load platform monitor');
      }
    } catch (err: any) {
      if (!isBackground) {
        setError(err.message || 'Failed to load platform monitor');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user?.isPlatformAdmin) {
      setLoading(false);
      return;
    }

    void fetchOverview();

    const intervalId = setInterval(() => {
      void fetchOverview({ background: true });
    }, ADMIN_MONITOR_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [authLoading, user?.isPlatformAdmin]);

  const handleToggleAdminRole = async (
    account: PlatformUserMonitorRow,
    makeAdmin: boolean
  ) => {
    try {
      setUpdatingRoleId(account.id);
      setRoleFeedback(null);

      const res = await fetchJsonWithBuffer(`/api/admin/users/${account.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makeAdmin }),
        timeoutMs: 15000,
      });

      if (!res.success || !res.user) {
        setRoleFeedback({
          type: 'error',
          message: res.error || 'Failed to update admin access',
        });
        return;
      }

      setConfirmRoleUserId(null);
      setOverview((prev) => {
        if (!prev) return prev;
        const nextUsers = prev.users.map((row) =>
          row.id === account.id
            ? {
                ...row,
                role: res.user.role,
                isPlatformAdmin: Boolean(res.user.isPlatformAdmin),
              }
            : row
        );
        const nextAdminCount = nextUsers.filter((r) => r.isPlatformAdmin).length;
        return {
          ...prev,
          kpis: {
            ...prev.kpis,
            platformAdmins: nextAdminCount,
            customerUsers: nextUsers.length - nextAdminCount,
          },
          users: nextUsers,
        };
      });
      setRoleFeedback({
        type: 'success',
        message: makeAdmin
          ? `${account.name} (${account.email}) upgraded to Platform Admin.`
          : `Removed Platform Admin access from ${account.name} (${account.email}).`,
      });
    } catch (err: any) {
      setRoleFeedback({
        type: 'error',
        message: err?.message || 'Failed to update admin access',
      });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!overview) return [];
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 86400000;
    const q = searchQuery.trim().toLowerCase();

    return overview.users.filter((row: PlatformUserMonitorRow) => {
      if (activeTab === 'active_7d') {
        if (!row.lastLoginAt || nowMs - new Date(row.lastLoginAt).getTime() > sevenDaysMs) {
          return false;
        }
      } else if (activeTab === 'with_invoices') {
        if (row.invoicesCount <= 0) return false;
      } else if (activeTab === 'admins') {
        if (!row.isPlatformAdmin) return false;
      }

      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.workspaceNames.some((w) => w.toLowerCase().includes(q))
      );
    });
  }, [overview, searchQuery, activeTab]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="h-32 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Sign In Required</h1>
        <p className="text-sm text-slate-500">
          Please sign in with your platform administrator account to view user analytics and system essentials.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (!user.isPlatformAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Platform Admin Access Required</h1>
        <p className="text-sm text-slate-500">
          Your account (<span className="font-medium text-slate-700">{user.email}</span>) does not have platform-wide monitoring privileges.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Back to Workspace Dashboard
        </Link>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Unable to Load Platform Metrics</h1>
        <p className="text-sm text-slate-500">{error || 'Unknown server error'}</p>
        <button
          type="button"
          onClick={() => fetchOverview()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const {
    kpis,
    currencyBreakdown,
    invoiceStatusCounts,
    quoteStatusCounts,
    trends,
    geminiUsage,
  } = overview;

  const avgSessionDuration =
    geminiUsage.sessionsTotal > 0
      ? Math.round(geminiUsage.durationSecondsTotal / geminiUsage.sessionsTotal)
      : 0;
  const avgSessionTokens =
    geminiUsage.sessionsTotal > 0
      ? Math.round(geminiUsage.totalTokensTotal / geminiUsage.sessionsTotal)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          User & Platform Essentials Monitor
        </h1>
        <p className="text-sm text-slate-500">
          Live account counts, workspace adoption, multi-currency billing volume, and Gemini API usage
        </p>
      </div>

      {/* Essential KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{kpis.totalUsers}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              +{kpis.newUsersLast7d} in 7d
            </span>
            <span className="text-slate-400">
              {kpis.activeUsersLast7d} active 7d · {kpis.customerUsers} customers
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workspaces
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {kpis.totalOrganizations}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{kpis.bankConfiguredOrgs} with bank setup</span>
            <span>·</span>
            <span>{kpis.stripeEnabledOrgs} Stripe enabled</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invoices & Quotes
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {kpis.totalInvoices}{' '}
            <span className="text-base font-medium text-slate-400">/ {kpis.totalQuotes} quotes</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {kpis.quoteConversionRatePct}% quote conversion
            </span>
            {kpis.overdueInvoices > 0 && (
              <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {kpis.overdueInvoices} overdue
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Platform Activity
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {kpis.totalClients}{' '}
            <span className="text-base font-medium text-slate-400">clients</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {kpis.totalProducts} catalog items · {kpis.totalPayments} recorded payments
          </div>
        </div>
      </div>

      {/* Trends + Gemini API Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DailyBarTrend
          title="New User Signups (14d)"
          subtitle={`${kpis.newUsersLast30d} new accounts in last 30 days`}
          points={trends.signups14d}
          barClassName="bg-blue-600 hover:bg-blue-700"
        />

        <DailyBarTrend
          title="Invoices Created (14d)"
          subtitle="Daily invoice creation cadence across all workspaces"
          points={trends.invoices14d}
          barClassName="bg-emerald-600 hover:bg-emerald-700"
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Gemini API Usage</span>
              </h3>
              <p className="text-xs text-slate-400">
                Voice sessions, connected time & tokens burned
              </p>
            </div>
            <span
              className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                geminiUsage.apiKeyConfigured
                  ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                  : 'bg-rose-50 text-rose-700 border-rose-200/80'
              }`}
            >
              {geminiUsage.apiKeyConfigured ? geminiUsage.activeModel : 'Key Missing'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Tokens Logged</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {formatCompactTokens(geminiUsage.totalTokensTotal)}
              </div>
              <div className="text-[10.5px] text-slate-400 tabular-nums mt-0.5">
                {formatCompactTokens(geminiUsage.promptTokensTotal)} in ·{' '}
                {formatCompactTokens(geminiUsage.responseTokensTotal)} out
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Voice Duration</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {formatDurationCompact(geminiUsage.durationSecondsTotal)}
              </div>
              <div className="text-[10.5px] text-slate-400 tabular-nums mt-0.5">
                {formatDurationCompact(geminiUsage.durationSeconds30d)} last 30d
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Live Sessions</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {geminiUsage.sessionsTotal}
              </div>
              <div className="text-[10.5px] text-slate-400 tabular-nums mt-0.5">
                {geminiUsage.sessions24h} 24h · {geminiUsage.sessions7d} 7d
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Tool Calls</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {geminiUsage.toolCallsTotal}
              </div>
              <div className="text-[10.5px] text-slate-400 tabular-nums mt-0.5">
                across {geminiUsage.turnsTotal} turns
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="inline-flex items-center gap-1">
              <Mic className="w-3 h-3 text-slate-400" />
              <span>30d: {geminiUsage.sessions30d} sessions · {formatCompactTokens(geminiUsage.totalTokens30d)} tok</span>
            </span>
            <span className="tabular-nums font-medium text-slate-500">
              Avg: {formatDurationCompact(avgSessionDuration)} / {formatCompactTokens(avgSessionTokens)} tok
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Currency Financial Volume & Document Funnel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Billing Volume by Currency</span>
              </h3>
              <p className="text-xs text-slate-400">
                Non-void invoices grouped cleanly by native currency (never cross-summed)
              </p>
            </div>
          </div>

          {currencyBreakdown.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-200 rounded-xl">
              No invoices created yet across the platform.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 pr-4">Currency</th>
                    <th className="py-2.5 px-3 text-right">Invoices</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Overdue</th>
                    <th className="py-2.5 px-3 text-right">Invoiced</th>
                    <th className="py-2.5 px-3 text-right">Collected</th>
                    <th className="py-2.5 pl-3 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {currencyBreakdown.map((row) => (
                    <tr key={row.currency} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-4 font-bold text-slate-900">
                        <span className="inline-flex items-center gap-2">
                          <span>{getCurrencyFlag(row.currency)}</span>
                          <span>{row.currency}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                        {row.invoiceCount}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-emerald-600 font-medium">
                        {row.paidCount}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-rose-600 font-medium">
                        {row.overdueCount}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold text-slate-900">
                        {formatCurrency(row.totalInvoicedCents, row.currency)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-emerald-700 font-semibold">
                        {formatCurrency(row.totalCollectedCents, row.currency)}
                      </td>
                      <td className="py-3 pl-3 text-right tabular-nums text-slate-600">
                        {formatCurrency(row.totalOutstandingCents, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Document Status Funnel</span>
            </h3>
            <p className="text-xs text-slate-400">Platform-wide lifecycle counts</p>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Invoices ({kpis.totalInvoices})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(invoiceStatusCounts).length === 0 ? (
                <span className="text-xs text-slate-400">No invoices yet</span>
              ) : (
                Object.entries(invoiceStatusCounts).map(([status, count]) => (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 capitalize"
                  >
                    <span>{status.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{count}</span>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quotes ({kpis.totalQuotes})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(quoteStatusCounts).length === 0 ? (
                <span className="text-xs text-slate-400">No quotes yet</span>
              ) : (
                Object.entries(quoteStatusCounts).map(([status, count]) => (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 capitalize"
                  >
                    <span>{status.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{count}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              User Accounts Directory ({filteredUsers.length})
            </h3>
            <p className="text-xs text-slate-400">
              Registered signups, owned workspaces, billing usage, and last sign-in activity
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              {(
                [
                  ['all', 'All'],
                  ['active_7d', 'Active 7d'],
                  ['with_invoices', 'With Invoices'],
                  ['admins', 'Admins'],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === tabId
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, email, or workspace..."
                className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {roleFeedback && (
            <div
              className={`mb-3 px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                roleFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <span>{roleFeedback.message}</span>
              <button
                type="button"
                onClick={() => setRoleFeedback(null)}
                className="text-[11px] font-semibold underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-4">Account</th>
                <th className="py-2.5 px-3">Workspaces</th>
                <th className="py-2.5 px-3">Currencies</th>
                <th className="py-2.5 px-3 text-right">Clients</th>
                <th className="py-2.5 px-3 text-right">Invoices / Quotes</th>
                <th className="py-2.5 px-3 text-right">Gemini Usage</th>
                <th className="py-2.5 px-3">Joined</th>
                <th className="py-2.5 px-3 text-right">Last Sign-In</th>
                <th className="py-2.5 pl-3 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {account.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5 font-semibold text-slate-900">
                            <span className="truncate">{account.name}</span>
                            {account.isPlatformAdmin && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                                Platform Admin
                              </span>
                            )}
                            {account.canLoadSampleData && (
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full">
                                Sample Data
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{account.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {account.workspacesCount === 0 ? (
                        <span className="text-slate-400">0 workspaces</span>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {account.workspacesCount}
                          </span>{' '}
                          <span className="text-slate-500 truncate max-w-[200px] inline-block align-bottom">
                            ({account.workspaceNames.join(', ')})
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {account.currencies.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          account.currencies.map((code) => (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700"
                            >
                              <span>{getCurrencyFlag(code)}</span>
                              <span>{code}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {account.clientsCount}
                    </td>

                    <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                      <span className="font-semibold text-slate-900">{account.invoicesCount}</span>
                      <span className="text-slate-400"> / {account.quotesCount}</span>
                    </td>

                    <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                      {account.geminiSessionsCount === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {account.geminiSessionsCount} sess
                          </span>{' '}
                          <span className="text-slate-400">
                            · {formatDurationCompact(account.geminiDurationSeconds)} ·{' '}
                            {formatCompactTokens(account.geminiTotalTokens)} tok
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatShortDate(account.createdAt)}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(account.lastLoginAt)}
                    </td>

                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      {account.isEnvAdmin ? (
                        <span className="text-[11px] font-medium text-slate-400">
                          Primary Admin
                        </span>
                      ) : account.id === user.id ? (
                        <span className="text-[11px] font-medium text-slate-400">
                          Current Account
                        </span>
                      ) : confirmRoleUserId === account.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingRoleId === account.id}
                            onClick={() =>
                              void handleToggleAdminRole(account, !account.isPlatformAdmin)
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 ${
                              account.isPlatformAdmin
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {updatingRoleId === account.id
                              ? 'Saving...'
                              : account.isPlatformAdmin
                              ? 'Confirm Revoke'
                              : 'Confirm Upgrade'}
                          </button>
                          <button
                            type="button"
                            disabled={updatingRoleId === account.id}
                            onClick={() => setConfirmRoleUserId(null)}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : account.isPlatformAdmin ? (
                        <button
                          type="button"
                          onClick={() => setConfirmRoleUserId(account.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer"
                        >
                          Revoke Admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRoleUserId(account.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors cursor-pointer"
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

