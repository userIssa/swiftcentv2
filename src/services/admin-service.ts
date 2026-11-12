import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import {
  isPlatformAdminEmail,
  isPlatformAdminUser,
  isSampleDataEnabledForEmail,
} from '@/lib/auth';
import { buildDailySeries, computePercentageRate, DailyActivityPoint } from '@/lib/admin-metrics';
import { GEMINI_LIVE_MODEL } from '@/lib/voice/tool-declarations';
import { User } from '@/models/User';
import { Organization } from '@/models/Organization';
import { Invoice } from '@/models/Invoice';
import { Quote } from '@/models/Quote';
import { Client } from '@/models/Client';
import { Product } from '@/models/Product';
import { Payment } from '@/models/Payment';
import { VoiceUsageLog } from '@/models/VoiceUsageLog';

export interface CurrencyVolumeSummary {
  currency: string;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  totalInvoicedCents: number;
  totalCollectedCents: number;
  totalOutstandingCents: number;
}

export interface PlatformUserMonitorRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isPlatformAdmin: boolean;
  isEnvAdmin: boolean;
  canLoadSampleData: boolean;
  workspacesCount: number;
  workspaceNames: string[];
  currencies: string[];
  invoicesCount: number;
  quotesCount: number;
  clientsCount: number;
  stripeEnabled: boolean;
  geminiSessionsCount: number;
  geminiDurationSeconds: number;
  geminiTotalTokens: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface GeminiUsageSummary {
  apiKeyConfigured: boolean;
  activeModel: string;
  sessionsTotal: number;
  sessions24h: number;
  sessions7d: number;
  sessions30d: number;
  durationSecondsTotal: number;
  durationSeconds30d: number;
  promptTokensTotal: number;
  responseTokensTotal: number;
  thoughtsTokensTotal: number;
  totalTokensTotal: number;
  totalTokens30d: number;
  toolCallsTotal: number;
  turnsTotal: number;
}

export interface PlatformAdminOverview {
  generatedAt: string;
  kpis: {
    totalUsers: number;
    customerUsers: number;
    platformAdmins: number;
    newUsersLast7d: number;
    newUsersLast30d: number;
    activeUsersLast7d: number;
    totalOrganizations: number;
    stripeEnabledOrgs: number;
    bankConfiguredOrgs: number;
    totalClients: number;
    totalProducts: number;
    totalInvoices: number;
    totalQuotes: number;
    convertedQuotes: number;
    quoteConversionRatePct: number;
    overdueInvoices: number;
    totalPayments: number;
  };
  currencyBreakdown: CurrencyVolumeSummary[];
  invoiceStatusCounts: Record<string, number>;
  quoteStatusCounts: Record<string, number>;
  trends: {
    signups14d: DailyActivityPoint[];
    invoices14d: DailyActivityPoint[];
  };
  geminiUsage: GeminiUsageSummary;
  databaseStatus: {
    connected: boolean;
    latencyMs: number | null;
  };
  users: PlatformUserMonitorRow[];
}

export async function getPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  await connectToDatabase();

  const now = new Date();
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const cutoff7d = new Date(now.getTime() - 7 * 86400000);
  const cutoff14d = new Date(now.getTime() - 14 * 86400000);
  const cutoff30d = new Date(now.getTime() - 30 * 86400000);

  let databaseLatencyMs: number | null = null;
  let databaseConnected = mongoose.connection.readyState === 1;
  try {
    const pingStart = Date.now();
    await mongoose.connection.db?.admin().ping();
    databaseLatencyMs = Math.max(1, Date.now() - pingStart);
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  const [
    users,
    organizations,
    invoiceOrgCounts,
    quoteOrgCounts,
    clientOrgCounts,
    totalProducts,
    totalPayments,
    invoiceCurrencyAgg,
    invoiceStatusAgg,
    quoteStatusAgg,
    recentInvoices,
    voiceUsageOverallAgg,
    voiceUsageByUserAgg,
  ] = await Promise.all([
    User.find({})
      .select('name email role createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .lean(),
    Organization.find({})
      .select('name ownerId currency paymentGateways.stripeEnabled wireInstructions.bankName wireInstructions.accountNumber createdAt')
      .lean(),
    Invoice.aggregate([
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
    Quote.aggregate([
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
    Client.aggregate([
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]),
    Product.countDocuments(),
    Payment.countDocuments(),
    Invoice.aggregate([
      {
        $match: {
          status: { $ne: 'void' },
        },
      },
      {
        $group: {
          _id: { $toUpper: { $ifNull: ['$currency', 'USD'] } },
          invoiceCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
          },
          totalInvoicedCents: { $sum: { $ifNull: ['$grandTotalCents', 0] } },
          totalCollectedCents: { $sum: { $ifNull: ['$paidCents', 0] } },
          totalOutstandingCents: { $sum: { $ifNull: ['$balanceDueCents', 0] } },
        },
      },
      { $sort: { invoiceCount: -1, totalInvoicedCents: -1 } },
    ]),
    Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Quote.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Invoice.find({ createdAt: { $gte: cutoff14d } })
      .select('createdAt')
      .lean(),
    VoiceUsageLog.aggregate([
      {
        $group: {
          _id: null,
          sessionsTotal: { $sum: 1 },
          sessions24h: {
            $sum: { $cond: [{ $gte: ['$startedAt', cutoff24h] }, 1, 0] },
          },
          sessions7d: {
            $sum: { $cond: [{ $gte: ['$startedAt', cutoff7d] }, 1, 0] },
          },
          sessions30d: {
            $sum: { $cond: [{ $gte: ['$startedAt', cutoff30d] }, 1, 0] },
          },
          durationSecondsTotal: { $sum: { $ifNull: ['$durationSeconds', 0] } },
          durationSeconds30d: {
            $sum: {
              $cond: [{ $gte: ['$startedAt', cutoff30d] }, { $ifNull: ['$durationSeconds', 0] }, 0],
            },
          },
          promptTokensTotal: { $sum: { $ifNull: ['$promptTokenCount', 0] } },
          responseTokensTotal: { $sum: { $ifNull: ['$responseTokenCount', 0] } },
          thoughtsTokensTotal: { $sum: { $ifNull: ['$thoughtsTokenCount', 0] } },
          totalTokensTotal: { $sum: { $ifNull: ['$totalTokenCount', 0] } },
          totalTokens30d: {
            $sum: {
              $cond: [{ $gte: ['$startedAt', cutoff30d] }, { $ifNull: ['$totalTokenCount', 0] }, 0],
            },
          },
          toolCallsTotal: { $sum: { $ifNull: ['$toolCallCount', 0] } },
          turnsTotal: { $sum: { $ifNull: ['$turnCount', 0] } },
        },
      },
    ]),
    VoiceUsageLog.aggregate([
      {
        $group: {
          _id: '$userId',
          sessions: { $sum: 1 },
          durationSeconds: { $sum: { $ifNull: ['$durationSeconds', 0] } },
          totalTokens: { $sum: { $ifNull: ['$totalTokenCount', 0] } },
        },
      },
    ]),
  ]);

  const voiceByUser = new Map<
    string,
    { sessions: number; durationSeconds: number; totalTokens: number }
  >();
  for (const row of voiceUsageByUserAgg) {
    if (row._id) {
      voiceByUser.set(row._id.toString(), {
        sessions: row.sessions || 0,
        durationSeconds: row.durationSeconds || 0,
        totalTokens: row.totalTokens || 0,
      });
    }
  }

  const invoiceCountByOrg = new Map<string, number>();
  for (const row of invoiceOrgCounts) {
    if (row._id) invoiceCountByOrg.set(row._id.toString(), row.count);
  }

  const quoteCountByOrg = new Map<string, number>();
  for (const row of quoteOrgCounts) {
    if (row._id) quoteCountByOrg.set(row._id.toString(), row.count);
  }

  const clientCountByOrg = new Map<string, number>();
  for (const row of clientOrgCounts) {
    if (row._id) clientCountByOrg.set(row._id.toString(), row.count);
  }

  let stripeEnabledOrgs = 0;
  let bankConfiguredOrgs = 0;
  const orgsByOwner = new Map<string, typeof organizations>();

  for (const org of organizations) {
    if (org.paymentGateways?.stripeEnabled) stripeEnabledOrgs += 1;
    if (org.wireInstructions?.bankName && org.wireInstructions?.accountNumber) {
      bankConfiguredOrgs += 1;
    }
    const ownerKey = org.ownerId ? org.ownerId.toString() : '';
    if (ownerKey) {
      const list = orgsByOwner.get(ownerKey) || [];
      list.push(org);
      orgsByOwner.set(ownerKey, list);
    }
  }

  const invoiceStatusCounts: Record<string, number> = {};
  let totalInvoices = 0;
  let overdueInvoices = 0;
  for (const row of invoiceStatusAgg) {
    const key = String(row._id || 'unknown');
    invoiceStatusCounts[key] = row.count;
    totalInvoices += row.count;
    if (key === 'overdue') overdueInvoices += row.count;
  }

  const quoteStatusCounts: Record<string, number> = {};
  let totalQuotes = 0;
  let convertedQuotes = 0;
  for (const row of quoteStatusAgg) {
    const key = String(row._id || 'unknown');
    quoteStatusCounts[key] = row.count;
    totalQuotes += row.count;
    if (key === 'converted') convertedQuotes += row.count;
  }

  const totalClients = clientOrgCounts.reduce((acc, row) => acc + (row.count || 0), 0);

  let platformAdmins = 0;
  let customerUsers = 0;
  let newUsersLast7d = 0;
  let newUsersLast30d = 0;
  let activeUsersLast7d = 0;

  const userRows: PlatformUserMonitorRow[] = users.map((u) => {
    const id = u._id.toString();
    const isAdmin = isPlatformAdminUser(u);
    if (isAdmin) {
      platformAdmins += 1;
    } else {
      customerUsers += 1;
    }

    const createdAtDate = u.createdAt ? new Date(u.createdAt) : now;
    if (createdAtDate >= cutoff7d) newUsersLast7d += 1;
    if (createdAtDate >= cutoff30d) newUsersLast30d += 1;
    if (u.lastLoginAt && new Date(u.lastLoginAt) >= cutoff7d) activeUsersLast7d += 1;

    const userOrgs = orgsByOwner.get(id) || [];
    let invoicesCount = 0;
    let quotesCount = 0;
    let clientsCount = 0;
    let stripeEnabled = false;
    const currencySet = new Set<string>();
    const workspaceNames: string[] = [];

    for (const org of userOrgs) {
      const orgId = org._id.toString();
      workspaceNames.push(org.name);
      if (org.currency) currencySet.add(org.currency.toUpperCase());
      if (org.paymentGateways?.stripeEnabled) stripeEnabled = true;
      invoicesCount += invoiceCountByOrg.get(orgId) || 0;
      quotesCount += quoteCountByOrg.get(orgId) || 0;
      clientsCount += clientCountByOrg.get(orgId) || 0;
    }

    const voiceMetrics = voiceByUser.get(id) || {
      sessions: 0,
      durationSeconds: 0,
      totalTokens: 0,
    };

    return {
      id,
      name: u.name,
      email: u.email,
      role: u.role,
      isPlatformAdmin: isAdmin,
      isEnvAdmin: isPlatformAdminEmail(u.email),
      canLoadSampleData: isSampleDataEnabledForEmail(u.email),
      workspacesCount: userOrgs.length,
      workspaceNames,
      currencies: Array.from(currencySet),
      invoicesCount,
      quotesCount,
      clientsCount,
      stripeEnabled,
      geminiSessionsCount: voiceMetrics.sessions,
      geminiDurationSeconds: voiceMetrics.durationSeconds,
      geminiTotalTokens: voiceMetrics.totalTokens,
      createdAt: createdAtDate.toISOString(),
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
    };
  });

  const usageSummaryRow = voiceUsageOverallAgg[0] || {};
  const apiKeyConfigured = Boolean(
    process.env.GEMINI_API_KEY?.trim() &&
      process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here'
  );

  const currencyBreakdown: CurrencyVolumeSummary[] = invoiceCurrencyAgg.map((row) => ({
    currency: String(row._id || 'USD'),
    invoiceCount: row.invoiceCount || 0,
    paidCount: row.paidCount || 0,
    overdueCount: row.overdueCount || 0,
    totalInvoicedCents: row.totalInvoicedCents || 0,
    totalCollectedCents: row.totalCollectedCents || 0,
    totalOutstandingCents: row.totalOutstandingCents || 0,
  }));

  return {
    generatedAt: now.toISOString(),
    kpis: {
      totalUsers: users.length,
      customerUsers,
      platformAdmins,
      newUsersLast7d,
      newUsersLast30d,
      activeUsersLast7d,
      totalOrganizations: organizations.length,
      stripeEnabledOrgs,
      bankConfiguredOrgs,
      totalClients,
      totalProducts,
      totalInvoices,
      totalQuotes,
      convertedQuotes,
      quoteConversionRatePct: computePercentageRate(convertedQuotes, totalQuotes),
      overdueInvoices,
      totalPayments,
    },
    currencyBreakdown,
    invoiceStatusCounts,
    quoteStatusCounts,
    trends: {
      signups14d: buildDailySeries(users, 14, now),
      invoices14d: buildDailySeries(recentInvoices, 14, now),
    },
    geminiUsage: {
      apiKeyConfigured,
      activeModel: GEMINI_LIVE_MODEL.replace(/^models\//, ''),
      sessionsTotal: usageSummaryRow.sessionsTotal || 0,
      sessions24h: usageSummaryRow.sessions24h || 0,
      sessions7d: usageSummaryRow.sessions7d || 0,
      sessions30d: usageSummaryRow.sessions30d || 0,
      durationSecondsTotal: usageSummaryRow.durationSecondsTotal || 0,
      durationSeconds30d: usageSummaryRow.durationSeconds30d || 0,
      promptTokensTotal: usageSummaryRow.promptTokensTotal || 0,
      responseTokensTotal: usageSummaryRow.responseTokensTotal || 0,
      thoughtsTokensTotal: usageSummaryRow.thoughtsTokensTotal || 0,
      totalTokensTotal: usageSummaryRow.totalTokensTotal || 0,
      totalTokens30d: usageSummaryRow.totalTokens30d || 0,
      toolCallsTotal: usageSummaryRow.toolCallsTotal || 0,
      turnsTotal: usageSummaryRow.turnsTotal || 0,
    },
    databaseStatus: {
      connected: databaseConnected,
      latencyMs: databaseLatencyMs,
    },
    users: userRows,
  };
}

