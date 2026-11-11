'use client';

import React, { useState } from 'react';
import {
  Mail,
  Send,
  Copy,
  Check,
  ExternalLink,
  X,
  Eye,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/engine/calculator';

interface SendDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'invoice' | 'quote';
  documentNumber: string;
  amountCents: number;
  currency?: string;
  clientName: string;
  clientEmail: string;
  publicToken: string;
  orgName: string;
  orgLogoUrl?: string;
  dueDate?: string | Date;
  onSend: () => Promise<void>;
}

export function SendDocumentModal({
  isOpen,
  onClose,
  documentType,
  documentNumber,
  amountCents,
  currency = 'USD',
  clientName,
  clientEmail,
  publicToken,
  orgName,
  orgLogoUrl,
  dueDate,
  onSend,
}: SendDocumentModalProps) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const isInvoice = documentType === 'invoice';
  const portalPath = isInvoice ? `/portal/${publicToken}` : `/portal/quotes/${publicToken}`;
  const fullPortalUrl = typeof window !== 'undefined' ? `${window.location.origin}${portalPath}` : portalPath;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullPortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    try {
      setSending(true);
      await onSend();
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Send {isInvoice ? 'Invoice' : 'Quote'} {documentNumber}
              </h3>
              <p className="text-[11px] text-slate-400">
                Deliver to {clientName} ({clientEmail})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {sentSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Dispatched Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {documentType === 'invoice' ? 'Invoice' : 'Quote'} notification was delivered to{' '}
                <span className="font-semibold">{clientEmail}</span>.
              </p>
            </div>
          ) : (
            <>
              {/* Live Email Preview Card */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Client Email Preview</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    To: {clientEmail}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 space-y-4 text-xs font-sans shadow-2xs">
                  {/* Fake Email Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      {orgLogoUrl ? (
                        <img
                          src={orgLogoUrl}
                          alt={orgName}
                          className="h-6 w-auto object-contain rounded"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                          {orgName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-slate-900">{orgName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Subject: {isInvoice ? `New Invoice ${documentNumber}` : `New Quote ${documentNumber}`} from {orgName}
                    </span>
                  </div>

                  {/* Email Body */}
                  <div className="space-y-2 text-slate-600">
                    <p>Hello <span className="font-semibold text-slate-800">{clientName}</span>,</p>
                    <p>
                      {orgName} has issued a new {isInvoice ? 'invoice' : 'estimate quote'} for your review.
                    </p>
                  </div>

                  {/* Highlight Box */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {isInvoice ? 'Total Due' : 'Estimated Total'}
                      </div>
                      <div className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                        {formatCurrency(amountCents, currency)}
                      </div>
                      {dueDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Due Date: {new Date(dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>

                  {/* CTA Button in Preview */}
                  <div className="text-center pt-1">
                    <div className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-xs">
                      <span>{isInvoice ? 'View & Pay Invoice Online' : 'Review & Approve Quote'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                    <span>Secure 256-bit encrypted client portal powered by SwiftCent</span>
                  </div>
                </div>
              </div>

              {/* Direct Link Share Pill */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Direct Client Portal Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullPortalUrl}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <a
                    href={portalPath}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!sentSuccess && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending Email...' : 'Send to Client'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

