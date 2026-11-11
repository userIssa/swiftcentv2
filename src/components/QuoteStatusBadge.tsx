import React from 'react';
import { QuoteStatus } from '@/models/Quote';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
  sent: {
    label: 'Sent',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  viewed: {
    label: 'Viewed',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  converted: {
    label: 'Converted to Invoice',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  declined: {
    label: 'Declined',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
};

export function QuoteStatusBadge({ status, size = 'md' }: QuoteStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-current/10 ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

