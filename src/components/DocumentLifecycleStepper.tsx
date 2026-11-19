'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileEdit,
  Send,
  CheckCircle2,
  Receipt,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export type LifecycleType = 'quote' | 'invoice';

interface DocumentLifecycleStepperProps {
  type: LifecycleType;
  status: string; // 'draft' | 'sent' | 'approved' | 'converted' | 'paid' | 'overdue' etc.
  convertedInvoiceId?: string | { _id: string; invoiceNumber: string };
  convertedInvoiceNumber?: string;
  sourceQuoteId?: string;
  sourceQuoteNumber?: string;
  className?: string;
}

export function DocumentLifecycleStepper({
  type,
  status,
  convertedInvoiceId,
  convertedInvoiceNumber,
  sourceQuoteId,
  sourceQuoteNumber,
  className = '',
}: DocumentLifecycleStepperProps) {
  const normStatus = (status || 'draft').toLowerCase();

  // Quote Lifecycle Steps
  if (type === 'quote') {
    const isDraft = normStatus === 'draft';
    const isSent = normStatus === 'sent' || normStatus === 'approved' || normStatus === 'converted';
    const isApproved = normStatus === 'approved' || normStatus === 'converted';
    const isConverted = normStatus === 'converted';

    const invId =
      typeof convertedInvoiceId === 'object' && convertedInvoiceId !== null
        ? convertedInvoiceId._id
        : typeof convertedInvoiceId === 'string'
        ? convertedInvoiceId
        : null;

    const invNum =
      typeof convertedInvoiceId === 'object' && convertedInvoiceId !== null
        ? convertedInvoiceId.invoiceNumber
        : convertedInvoiceNumber || 'View Invoice';

    return (
      <div className={`bg-white dark:bg-[#111111] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xs ${className}`}>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Connected Lifecycle
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
              Proposal ➔ Invoice ➔ Payment
            </span>
          </div>

          {isConverted && invId && (
            <Link
              href={`/invoices/${invId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              <span>{invNum}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* 4-Step Progress Ribbon */}
        <div className="grid grid-cols-4 gap-2 relative">
          {/* Step 1: Draft */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                isDraft || isSent || isApproved || isConverted
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200">Draft</span>
            <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">Scope Created</span>
          </div>

          {/* Step 2: Sent */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                isSent
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[11px] font-semibold ${isSent ? 'text-slate-800 dark:text-neutral-200' : 'text-slate-400 dark:text-neutral-500'}`}>
              Sent
            </span>
            <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">Portal Active</span>
          </div>

          {/* Step 3: Approved */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                isApproved
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[11px] font-semibold ${isApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-500'}`}>
              Approved
            </span>
            <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">Client Signed</span>
          </div>

          {/* Step 4: Converted to Invoice */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                isConverted
                  ? 'bg-purple-600 text-white shadow-xs animate-in zoom-in-50 duration-200'
                  : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[11px] font-semibold ${isConverted ? 'text-purple-700 dark:text-purple-400' : 'text-slate-400 dark:text-neutral-500'}`}>
              Invoiced
            </span>
            <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">Billing Ready</span>
          </div>
        </div>
      </div>
    );
  }

  // Invoice Lifecycle Steps
  const isDraft = normStatus === 'draft';
  const isIssued = normStatus !== 'draft';
  const isPending = normStatus === 'sent' || normStatus === 'viewed' || normStatus === 'partially_paid';
  const isPaid = normStatus === 'paid';
  const isOverdue = normStatus === 'overdue';

  return (
    <div className={`bg-white dark:bg-[#111111] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Payment Lifecycle
          </span>
          {sourceQuoteId && (
            <Link
              href={`/quotes/${sourceQuoteId}`}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 inline-flex items-center gap-1 hover:underline"
            >
              <span>Converted from {sourceQuoteNumber || 'Proposal'}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>

        {isPaid && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Settled in Full</span>
          </span>
        )}
      </div>

      {/* 4-Step Progress Ribbon */}
      <div className="grid grid-cols-4 gap-2 relative">
        {/* Step 1: Draft */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
              isDraft || isIssued
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200">Created</span>
          <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">Calculated Math</span>
        </div>

        {/* Step 2: Issued */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
              isIssued
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </div>
          <span className={`text-[11px] font-semibold ${isIssued ? 'text-slate-800 dark:text-neutral-200' : 'text-slate-400 dark:text-neutral-500'}`}>
            Issued
          </span>
          <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">Dispatched</span>
        </div>

        {/* Step 3: In Flight / Pending */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
              isOverdue
                ? 'bg-rose-600 text-white shadow-xs'
                : isPaid || isPending
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <span className={`text-[11px] font-semibold ${isOverdue ? 'text-rose-600' : isPaid || isPending ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-neutral-500'}`}>
            {isOverdue ? 'Overdue' : 'Pending'}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">
            {isOverdue ? 'Action Needed' : 'Awaiting Payment'}
          </span>
        </div>

        {/* Step 4: Settled */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
              isPaid
                ? 'bg-emerald-600 text-white shadow-xs animate-in zoom-in-50 duration-200'
                : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className={`text-[11px] font-semibold ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-500'}`}>
            Settled
          </span>
          <span className="text-[9px] text-slate-400 dark:text-neutral-500 hidden sm:inline">Ledger Cleared</span>
        </div>
      </div>
    </div>
  );
}

