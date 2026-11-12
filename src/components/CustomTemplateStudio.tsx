'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  FileText,
  Image as ImageIcon,
  SlidersHorizontal,
  Save,
  SplitSquareVertical,
  Eye,
  X,
  Code2,
  Wand2,
} from 'lucide-react';
import { useActiveBusiness } from '@/context/ActiveBusinessContext';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';
import { capturePreviewSnapshotDataUrl } from '@/lib/dom-snapshot';
import {
  CustomTemplateConfig,
  CustomTemplateFontStyle,
  CustomTemplateHeaderStyle,
  CustomTemplateTableStyle,
  normalizeCustomTemplateConfig,
} from '@/lib/custom-template';
import { DocumentTemplateView } from '@/components/DocumentTemplateView';

const MAX_CLIENT_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_DIMENSION_PX = 1600;
const ACCEPTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

async function optimizeImageDataUrl(
  rawDataUrl: string,
  mimeType: string
): Promise<{ dataUrl: string; mimeType: string }> {
  if (mimeType === 'application/pdf' || typeof window === 'undefined') {
    return { dataUrl: rawDataUrl, mimeType };
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h || (w <= MAX_IMAGE_DIMENSION_PX && h <= MAX_IMAGE_DIMENSION_PX && rawDataUrl.length < 950_000)) {
        resolve({ dataUrl: rawDataUrl, mimeType });
        return;
      }
      const scale = Math.min(1, MAX_IMAGE_DIMENSION_PX / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ dataUrl: rawDataUrl, mimeType });
        return;
      }
      // Preserve crisp white background under transparent PNGs before encoding JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const encoded = canvas.toDataURL('image/jpeg', 0.92);
      resolve({ dataUrl: encoded, mimeType: 'image/jpeg' });
    };
    img.onerror = () => resolve({ dataUrl: rawDataUrl, mimeType });
    img.src = rawDataUrl;
  });
}

const HEADER_OPTIONS: Array<{ value: CustomTemplateHeaderStyle; label: string }> = [
  { value: 'split_classic', label: 'Split Classic' },
  { value: 'top_banner', label: 'Top Banner' },
  { value: 'left_stripe', label: 'Left Stripe' },
  { value: 'centered_editorial', label: 'Centered' },
  { value: 'minimal_grid', label: 'Minimal Grid' },
];

const TABLE_OPTIONS: Array<{ value: CustomTemplateTableStyle; label: string }> = [
  { value: 'solid_header', label: 'Solid Header' },
  { value: 'subtle_tint', label: 'Soft Tint' },
  { value: 'bordered_grid', label: 'Full Grid' },
  { value: 'minimal_lines', label: 'Hairlines' },
];

const FONT_OPTIONS: Array<{ value: CustomTemplateFontStyle; label: string }> = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
];

export interface CustomTemplateStudioProps {
  targetOrganizationId?: string;
  targetOrganizationName?: string;
  initialTemplate?: CustomTemplateConfig | null;
  sampleDocument?: any;
  defaultDocType?: 'invoice' | 'quote';
  onSaved?: (template: CustomTemplateConfig | null) => void;
  onClose?: () => void;
}

export function CustomTemplateStudio({
  targetOrganizationId,
  targetOrganizationName,
  initialTemplate,
  sampleDocument,
  defaultDocType = 'invoice',
  onSaved,
  onClose,
}: CustomTemplateStudioProps = {}) {
  const { activeBusiness, refreshBusinesses } = useActiveBusiness();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resolvedOrgId = targetOrganizationId || activeBusiness?._id;
  const resolvedBrandSource = sampleDocument?.organizationSnapshot || activeBusiness;

  const rawSourceTemplate =
    initialTemplate !== undefined
      ? initialTemplate
      : activeBusiness?.branding?.customTemplate;

  const savedTemplate = rawSourceTemplate
    ? normalizeCustomTemplateConfig(rawSourceTemplate)
    : null;

  const [draftTemplate, setDraftTemplate] = useState<CustomTemplateConfig | null>(
    savedTemplate
  );
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewDocType, setPreviewDocType] = useState<'invoice' | 'quote'>(defaultDocType);
  const [compareMode, setCompareMode] = useState<'split' | 'live' | 'code'>('split');
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset studio state cleanly when switching target organization
  useEffect(() => {
    const nextSource =
      initialTemplate !== undefined
        ? initialTemplate
        : activeBusiness?.branding?.customTemplate;
    const nextSaved = nextSource ? normalizeCustomTemplateConfig(nextSource) : null;
    setDraftTemplate(nextSaved);
    setUploadedFileUrl(null);
    setUploadedMimeType('');
    setUploadedFileName('');
    setError(null);
    setStatusMessage(null);
  }, [resolvedOrgId]);

  // Also sync when activeBusiness finishes saving from server
  useEffect(() => {
    if (!uploadedFileUrl && initialTemplate === undefined && activeBusiness?.branding?.customTemplate) {
      setDraftTemplate(
        normalizeCustomTemplateConfig(activeBusiness.branding.customTemplate)
      );
    }
  }, [activeBusiness?.branding?.customTemplate, initialTemplate]);

  const handleSelectFile = (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    setStatusMessage(null);

    const mime = (file.type || '').toLowerCase();
    if (!ACCEPTED_TYPES.has(mime)) {
      setError('Please upload a PNG, JPG, WebP image, or PDF invoice file.');
      return;
    }
    if (file.size > MAX_CLIENT_BYTES) {
      setError('File is too large (max 6 MB). Compress or export a single-page PNG/PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setError('Could not read the selected file.');
        return;
      }
      const optimized = await optimizeImageDataUrl(result, mime);
      setUploadedFileUrl(optimized.dataUrl);
      setUploadedMimeType(optimized.mimeType);
      setUploadedFileName(file.name);
    };
    reader.onerror = () => {
      setError('Failed to read the selected file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeWithGemini = async (
    refineExisting = false,
    autoVisualPolish = false
  ) => {
    if (!resolvedOrgId) return;
    if (!uploadedFileUrl) {
      setError('Upload an invoice image or PDF first.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    setStatusMessage(null);

    try {
      let renderedSnapshotDataUrl: string | undefined;
      if (autoVisualPolish && previewContainerRef.current && draftTemplate) {
        const sheetEl =
          (previewContainerRef.current.querySelector('.sc-sheet-frame') as HTMLElement) ||
          previewContainerRef.current;
        const snap = await capturePreviewSnapshotDataUrl(sheetEl, {
          '--sc-primary': draftTemplate.palette.primaryColor,
          '--sc-secondary': draftTemplate.palette.secondaryColor,
          '--sc-header-text': draftTemplate.palette.headerTextColor,
          '--sc-page-bg': draftTemplate.palette.pageBackground,
          '--sc-surface': draftTemplate.palette.surfaceTint,
          '--sc-border': draftTemplate.palette.borderColor,
          '--sc-text': draftTemplate.palette.textColor,
          '--sc-muted': draftTemplate.palette.mutedTextColor,
        });
        if (snap) renderedSnapshotDataUrl = snap;
      }

      const data = await fetchJsonWithBuffer(
        `/api/organizations/${resolvedOrgId}/template/recreate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileDataUrl: uploadedFileUrl,
            mimeType: uploadedMimeType,
            tweakPrompt: tweakPrompt.trim(),
            ...(renderedSnapshotDataUrl ? { renderedSnapshotDataUrl } : {}),
            ...(refineExisting && draftTemplate?.htmlTemplate
              ? {
                  previousTemplate: {
                    htmlTemplate: draftTemplate.htmlTemplate,
                    cssStyles: draftTemplate.cssStyles,
                  },
                }
              : {}),
          }),
          timeoutMs: 65000,
        }
      );
      if (!data.success || !data.template) {
        throw new Error(data.error || 'Gemini failed to recreate template.');
      }
      setDraftTemplate(normalizeCustomTemplateConfig(data.template));
      setCompareMode((prev) => (prev === 'code' ? 'code' : 'split'));
      setStatusMessage(
        `${autoVisualPolish ? 'Visual compare & polish complete' : 'Template blueprint generated'}${data.modelUsed ? ` (${data.modelUsed})` : ''}. Review live below and click "Save Workspace Template" to activate.`
      );
    } catch (err: any) {
      setError(err?.message || 'Could not analyze template.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToWorkspace = async () => {
    if (!resolvedOrgId || !draftTemplate) return;
    setSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const payload = normalizeCustomTemplateConfig({
        ...draftTemplate,
        updatedAt: new Date().toISOString(),
      });
      const data = await fetchJsonWithBuffer(`/api/organizations/${resolvedOrgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customTemplate: payload }),
        timeoutMs: 15000,
      });
      if (!data.success) {
        throw new Error(data.error || 'Failed to save custom template.');
      }
      setDraftTemplate(payload);
      await refreshBusinesses();
      onSaved?.(payload);
      setStatusMessage(
        'Saved! All new & existing invoices and quotes in this workspace will default to your custom format.'
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to save workspace template.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearTemplate = async () => {
    if (!resolvedOrgId) return;
    setSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const data = await fetchJsonWithBuffer(`/api/organizations/${resolvedOrgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customTemplate: null }),
        timeoutMs: 15000,
      });
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove custom template.');
      }
      setDraftTemplate(null);
      setUploadedFileUrl(null);
      setUploadedFileName('');
      await refreshBusinesses();
      onSaved?.(null);
      setStatusMessage('Custom template removed. Workspace reverted to standard built-in themes.');
    } catch (err: any) {
      setError(err?.message || 'Failed to remove template.');
    } finally {
      setSaving(false);
    }
  };

  const samplePreviewDoc = useMemo(() => {
    if (sampleDocument && previewDocType === defaultDocType) {
      return sampleDocument;
    }
    const currency = activeBusiness?.currency || 'USD';
    return {
      invoiceNumber: `${activeBusiness?.invoicePrefix || 'INV'}-01042`,
      quoteNumber: `${activeBusiness?.quotePrefix || 'QTE'}-00318`,
      status: previewDocType === 'invoice' ? 'sent' : 'approved',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      currency,
      organizationSnapshot: {
        name: resolvedBrandSource?.name || 'Apex Studio LLC',
        email: resolvedBrandSource?.email || 'billing@apexstudio.io',
        phone: resolvedBrandSource?.phone || '+1 (415) 555-0192',
        website: resolvedBrandSource?.website || 'https://apexstudio.io',
        tagline: resolvedBrandSource?.tagline || 'Digital Strategy & Product Design',
        taxId: resolvedBrandSource?.taxId || 'US-TAX-90482',
        address: resolvedBrandSource?.address || {
          street: '450 Market Street, Suite 400',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
        },
        branding: {
          logoUrl: resolvedBrandSource?.branding?.logoUrl,
          primaryColor: resolvedBrandSource?.branding?.primaryColor || '#2563eb',
        },
      },
      clientSnapshot: {
        name: 'Northstar Ventures Ltd.',
        email: 'accounts@northstar.co',
        billingAddress: {
          street: '188 King Street West',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M5H 1K4',
          country: 'Canada',
        },
      },
      items: [
        {
          description: 'Brand Architecture & Design System Retainer',
          quantity: 1,
          unitPriceCents: 240000,
          discountCents: 0,
          lineTaxCents: 18000,
          lineTotalCents: 258000,
        },
        {
          description: 'Custom Web Checkout Integration (Milestone 2)',
          quantity: 12,
          unitPriceCents: 15000,
          discountCents: 0,
          lineTaxCents: 13500,
          lineTotalCents: 193500,
        },
      ],
      subtotalCents: 420000,
      totalDiscountCents: 0,
      totalTaxCents: 31500,
      grandTotalCents: 451500,
      paidCents: 0,
      balanceDueCents: 451500,
      notes: 'Thank you for partnering with us. Please reference your invoice number on wire transfers.',
    };
  }, [activeBusiness, previewDocType]);

  const updateDraftField = <K extends keyof CustomTemplateConfig>(
    key: K,
    value: CustomTemplateConfig[K]
  ) => {
    setDraftTemplate((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateDraftPalette = (
    key: keyof CustomTemplateConfig['palette'],
    value: string
  ) => {
    setDraftTemplate((prev) =>
      prev
        ? {
            ...prev,
            palette: {
              ...prev.palette,
              [key]: value,
            },
          }
        : prev
    );
  };

  const updateDraftLabel = (
    key: keyof CustomTemplateConfig['labels'],
    value: string
  ) => {
    setDraftTemplate((prev) =>
      prev
        ? {
            ...prev,
            labels: {
              ...prev.labels,
              [key]: value,
            },
          }
        : prev
    );
  };

  return (
    <div
      id="custom-template"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                AI Custom Invoice Template Recreator
              </h3>
              {targetOrganizationName && (
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {targetOrganizationName}
                </span>
              )}
              {savedTemplate && (
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active on Workspace
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your existing invoice image or PDF and Gemini will recreate its layout, colors, and typography for your workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {(savedTemplate || draftTemplate) && (
            <button
              type="button"
              onClick={handleClearTemplate}
              disabled={saving || analyzing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Template</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Step 1: Upload + Prompt + Recreate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleSelectFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-6 border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[150px] ${
            isDragging
              ? 'border-blue-500 bg-blue-50/40'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleSelectFile(e.target.files?.[0])}
          />
          {uploadedFileName ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                {uploadedMimeType === 'application/pdf' ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div className="text-xs font-bold text-slate-900 max-w-[260px] truncate">
                {uploadedFileName}
              </div>
              <span className="text-[11px] font-medium text-blue-600 hover:underline">
                Click or drop to replace file
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-2xs">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-800">
                Drop your existing invoice format here
              </div>
              <p className="text-[11px] text-slate-400">
                Supports PNG, JPG, WebP, or PDF (max 6 MB)
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between gap-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Optional Style Adjustments for Gemini
            </label>
            <textarea
              rows={3}
              value={tweakPrompt}
              onChange={(e) => setTweakPrompt(e.target.value)}
              maxLength={400}
              placeholder="Optional: e.g. 'Match this exact grid layout, change primary bar to #0f172a, and show line item # numbers'"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => handleAnalyzeWithGemini(false)}
            disabled={!uploadedFileUrl || analyzing || !resolvedOrgId}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-45 cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recreating Pixel-Faithful Layout...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Recreate Template with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Fine-Tune + Live Preview */}
      {draftTemplate && (
        <div className="space-y-5 pt-3 border-t border-slate-100">
          {/* Detected AI Summary & Fine-Tune Bar */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {draftTemplate.detectedStyleSummary}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {draftTemplate.renderMode === 'html'
                        ? 'Pixel-Faithful AI HTML'
                        : 'Preset Blueprint'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {draftTemplate.renderMode === 'html'
                      ? 'Adjust live palette colors, refine with Gemini below, or save straight to your workspace.'
                      : 'Fine-tune colors, layout structure, or labels below — updates live instantaneously.'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {uploadedFileUrl && draftTemplate.renderMode === 'html' && (
                  <button
                    type="button"
                    onClick={() => handleAnalyzeWithGemini(true, true)}
                    disabled={saving || analyzing}
                    title="Send a visual snapshot of the current render beside your reference image to auto-fix layout & spacing drift"
                    className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {analyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span>Auto-Polish Match</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveToWorkspace}
                  disabled={saving || analyzing}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Workspace Template'}</span>
                </button>
              </div>
            </div>

            {/* Quick Tweaks Grid */}
            {draftTemplate.renderMode === 'html' ? (
              <div className="space-y-3 pt-2 border-t border-slate-200/70">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={draftTemplate.name}
                      maxLength={50}
                      onChange={(e) => updateDraftField('name', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {uploadedFileUrl && (
                    <div className="md:col-span-8 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Ask Gemini to Refine Any Visual Detail
                        </label>
                        <input
                          type="text"
                          value={tweakPrompt}
                          onChange={(e) => setTweakPrompt(e.target.value)}
                          maxLength={400}
                          placeholder="e.g. 'Make the header diagonal purple angle steeper, tighten item spacing, bold Grand Total'"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeWithGemini(true)}
                        disabled={analyzing || saving || !tweakPrompt.trim()}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-45 cursor-pointer shrink-0 sm:self-end"
                      >
                        {analyzing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        <span>Refine Layout</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="color"
                      value={draftTemplate.palette.primaryColor}
                      onChange={(e) => updateDraftPalette('primaryColor', e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-medium text-slate-600">Primary</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="color"
                      value={draftTemplate.palette.secondaryColor}
                      onChange={(e) => updateDraftPalette('secondaryColor', e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-medium text-slate-600">Secondary</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="color"
                      value={draftTemplate.palette.headerTextColor}
                      onChange={(e) => updateDraftPalette('headerTextColor', e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-medium text-slate-600">Header Text</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="color"
                      value={draftTemplate.palette.surfaceTint}
                      onChange={(e) => updateDraftPalette('surfaceTint', e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-medium text-slate-600">Surface Tint</span>
                  </label>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] font-medium text-slate-500">Doc Heading:</span>
                    <input
                      type="text"
                      value={draftTemplate.labels.invoiceTitle || ''}
                      maxLength={32}
                      onChange={(e) => updateDraftLabel('invoiceTitle', e.target.value)}
                      className="w-32 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/70">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={draftTemplate.name}
                  maxLength={50}
                  onChange={(e) => updateDraftField('name', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Header Layout
                </label>
                <select
                  value={draftTemplate.headerStyle}
                  onChange={(e) =>
                    updateDraftField(
                      'headerStyle',
                      e.target.value as CustomTemplateHeaderStyle
                    )
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                >
                  {HEADER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Table Style
                </label>
                <select
                  value={draftTemplate.tableStyle}
                  onChange={(e) =>
                    updateDraftField(
                      'tableStyle',
                      e.target.value as CustomTemplateTableStyle
                    )
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                >
                  {TABLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Typography
                </label>
                <div className="flex gap-1">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => updateDraftField('fontStyle', f.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        draftTemplate.fontStyle === f.value
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color pickers + Switches + Heading label */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="color"
                  value={draftTemplate.palette.primaryColor}
                  onChange={(e) => updateDraftPalette('primaryColor', e.target.value)}
                  className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-medium text-slate-600">Primary</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="color"
                  value={draftTemplate.palette.headerTextColor}
                  onChange={(e) =>
                    updateDraftPalette('headerTextColor', e.target.value)
                  }
                  className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-medium text-slate-600">Header Text</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="color"
                  value={draftTemplate.palette.surfaceTint}
                  onChange={(e) => updateDraftPalette('surfaceTint', e.target.value)}
                  className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-medium text-slate-600">Surface Tint</span>
              </label>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={draftTemplate.rowStriping}
                  onChange={(e) => updateDraftField('rowStriping', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Zebra Rows</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={draftTemplate.showItemIndex}
                  onChange={(e) => updateDraftField('showItemIndex', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span># Column</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={draftTemplate.uppercaseHeaders}
                  onChange={(e) =>
                    updateDraftField('uppercaseHeaders', e.target.checked)
                  }
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Uppercase Headings</span>
              </label>

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] font-medium text-slate-500">Title:</span>
                <input
                  type="text"
                  value={draftTemplate.labels.invoiceTitle || ''}
                  maxLength={32}
                  onChange={(e) => updateDraftLabel('invoiceTitle', e.target.value)}
                  className="w-32 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
            </>
            )}
          </div>

          {/* Preview Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Preview As:
              </span>
              {(['invoice', 'quote'] as const).map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setPreviewDocType(dt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                    previewDocType === dt
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {uploadedFileUrl && (
                <button
                  type="button"
                  onClick={() => setCompareMode('split')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    compareMode === 'split'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setCompareMode('live')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  compareMode === 'live'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full Live Sheet</span>
              </button>
              {draftTemplate.renderMode === 'html' && (
                <button
                  type="button"
                  onClick={() => setCompareMode('code')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    compareMode === 'code'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>HTML / CSS Code</span>
                </button>
              )}
            </div>
          </div>

          {/* Side-by-Side Reference vs Code vs Live Preview */}
          <div
            className={`grid gap-5 ${
              (uploadedFileUrl && compareMode === 'split') ||
              compareMode === 'code'
                ? 'grid-cols-1 xl:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {compareMode === 'code' && draftTemplate.renderMode === 'html' && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Direct HTML &amp; CSS Editor (Live Updating)
                </div>
                <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      HTML Template (with {'{{...}}'} SwiftCent data tokens)
                    </label>
                    <textarea
                      rows={11}
                      value={draftTemplate.htmlTemplate || ''}
                      onChange={(e) =>
                        updateDraftField('htmlTemplate', e.target.value)
                      }
                      spellCheck={false}
                      className="w-full font-mono text-[11px] leading-relaxed bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Scoped CSS Styles (.sc-doc)
                    </label>
                    <textarea
                      rows={10}
                      value={draftTemplate.cssStyles || ''}
                      onChange={(e) =>
                        updateDraftField('cssStyles', e.target.value)
                      }
                      spellCheck={false}
                      className="w-full font-mono text-[11px] leading-relaxed bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {uploadedFileUrl && compareMode === 'split' && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Your Uploaded Reference
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center min-h-[480px] max-h-[680px]">
                  {uploadedMimeType === 'application/pdf' ? (
                    <object
                      data={uploadedFileUrl}
                      type="application/pdf"
                      className="w-full h-[640px]"
                    >
                      <div className="p-6 text-center text-xs text-slate-600">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="font-semibold">{uploadedFileName}</p>
                        <p className="text-slate-400 mt-1">
                          PDF analyzed by Gemini — view the live recreated blueprint on the right.
                        </p>
                      </div>
                    </object>
                  ) : (
                    <img
                      src={uploadedFileUrl}
                      alt="Uploaded Invoice Reference"
                      className="max-h-[660px] w-auto object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SwiftCent Live Blueprint Preview
              </div>
              <div ref={previewContainerRef}>
                <DocumentTemplateView
                  doc={samplePreviewDoc}
                  type={previewDocType}
                  showControls={false}
                  previewCustomTemplate={draftTemplate}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

