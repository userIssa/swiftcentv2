import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { resolveAuthorizedOrganization } from '@/lib/voice/server-auth';
import { VoiceUsageLog } from '@/models/VoiceUsageLog';
import {
  buildTemplateExtractionPrompt,
  normalizeCustomTemplateConfig,
} from '@/lib/custom-template';

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6 MB raw file limit
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

const VISION_MODEL_CANDIDATES = [
  ...(process.env.GEMINI_TEMPLATE_MODEL ? [process.env.GEMINI_TEMPLATE_MODEL.trim()] : []),
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
].filter((model, index, list) => Boolean(model) && list.indexOf(model) === index);

const PER_MODEL_TIMEOUT_MS = 22000;
const TOTAL_SERVER_BUDGET_MS = 56000;

function isModelFallbackError(error: any): boolean {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return true;
  const status = Number(error?.status || error?.statusCode || 0);
  if (status === 404 || status === 408 || status === 429 || status === 503 || status === 504) {
    return true;
  }
  const msg = String(error?.message || '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborted') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('limit: 0') ||
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('not_found') ||
    msg.includes('unsupported') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable')
  );
}

function extractBase64Payload(
  rawDataUrlOrBase64: string,
  explicitMime?: string
): { base64: string; mimeType: string } | null {
  const trimmed = rawDataUrlOrBase64.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1].toLowerCase().trim();
    return { mimeType, base64: dataUrlMatch[2].replace(/\s+/g, '') };
  }
  if (!explicitMime) return null;
  return {
    mimeType: explicitMime.toLowerCase().trim(),
    base64: trimmed.replace(/\s+/g, ''),
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = new Date();
  try {
    const { id } = await params;
    const auth = await resolveAuthorizedOrganization(id);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        {
          success: false,
          code: 'MISSING_API_KEY',
          error:
            'GEMINI_API_KEY is not configured on the server. Add it to .env.local to recreate invoice templates.',
        },
        { status: 503 }
      );
    }

    let base64Data = '';
    let mimeType = '';
    let tweakPrompt = '';
    let previousTemplate:
      | { htmlTemplate?: string; cssStyles?: string }
      | undefined;
    let snapshotPayload: { base64: string; mimeType: string } | null = null;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const uploaded = formData.get('file');
      const rawTweak = formData.get('tweakPrompt');
      if (typeof rawTweak === 'string') {
        tweakPrompt = rawTweak;
      }
      if (!(uploaded instanceof File)) {
        return NextResponse.json(
          { success: false, error: 'Please upload a PNG, JPG, WebP, or PDF invoice file.' },
          { status: 400 }
        );
      }
      mimeType = (uploaded.type || '').toLowerCase().trim();
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported file type (${mimeType || 'unknown'}). Upload PNG, JPG, WebP, or PDF.`,
          },
          { status: 400 }
        );
      }
      if (uploaded.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Uploaded template exceeds the 6 MB size limit.' },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await uploaded.arrayBuffer());
      base64Data = buffer.toString('base64');
    } else {
      const body = await request.json().catch(() => ({}));
      if (typeof body.tweakPrompt === 'string') {
        tweakPrompt = body.tweakPrompt;
      }
      if (body.previousTemplate && typeof body.previousTemplate === 'object') {
        previousTemplate = {
          htmlTemplate:
            typeof body.previousTemplate.htmlTemplate === 'string'
              ? body.previousTemplate.htmlTemplate
              : undefined,
          cssStyles:
            typeof body.previousTemplate.cssStyles === 'string'
              ? body.previousTemplate.cssStyles
              : undefined,
        };
      }
      if (
        typeof body.renderedSnapshotDataUrl === 'string' &&
        body.renderedSnapshotDataUrl.trim()
      ) {
        const snap = extractBase64Payload(body.renderedSnapshotDataUrl);
        if (
          snap &&
          (snap.mimeType === 'image/jpeg' ||
            snap.mimeType === 'image/png' ||
            snap.mimeType === 'image/webp') &&
          Math.ceil((snap.base64.length * 3) / 4) <= 3 * 1024 * 1024
        ) {
          snapshotPayload = snap;
        }
      }
      const rawFile =
        typeof body.fileDataUrl === 'string'
          ? body.fileDataUrl
          : typeof body.base64Data === 'string'
            ? body.base64Data
            : '';
      const explicitMime = typeof body.mimeType === 'string' ? body.mimeType : undefined;
      const parsed = extractBase64Payload(rawFile, explicitMime);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: 'Missing uploaded invoice image or PDF payload.' },
          { status: 400 }
        );
      }
      mimeType = parsed.mimeType;
      base64Data = parsed.base64;
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported file type (${mimeType || 'unknown'}). Upload PNG, JPG, WebP, or PDF.`,
          },
          { status: 400 }
        );
      }
      const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
      if (estimatedBytes > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Uploaded template exceeds the 6 MB size limit.' },
          { status: 400 }
        );
      }
    }

    const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
    const promptText = buildTemplateExtractionPrompt(
      tweakPrompt,
      previousTemplate,
      Boolean(snapshotPayload)
    );

    const mediaPart =
      mimeType === 'application/pdf'
        ? {
            type: 'document' as const,
            data: base64Data,
            mime_type: 'application/pdf',
          }
        : {
            type: 'image' as const,
            data: base64Data,
            mime_type: mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
          };

    const snapshotPart = snapshotPayload
      ? {
          type: 'image' as const,
          data: snapshotPayload.base64,
          mime_type: snapshotPayload.mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
        }
      : null;

    const multimodalInput = snapshotPart
      ? [{ type: 'text' as const, text: promptText }, mediaPart, snapshotPart]
      : [{ type: 'text' as const, text: promptText }, mediaPart];

    let modelUsed = VISION_MODEL_CANDIDATES[0];
    let interaction: any = null;
    let lastModelError: any = null;

    for (const candidateModel of VISION_MODEL_CANDIDATES) {
      if (Date.now() - startedAt.getTime() >= TOTAL_SERVER_BUDGET_MS) {
        break;
      }
      modelUsed = candidateModel;
      try {
        const thinkingLevel: 'minimal' | 'low' = candidateModel.includes('lite')
          ? 'minimal'
          : 'low';
        interaction = await ai.interactions.create(
          {
            model: candidateModel,
            input: multimodalInput,
            ...(candidateModel.startsWith('gemini-3')
              ? { generation_config: { thinking_level: thinkingLevel } }
              : {}),
          },
          {
            timeout_ms: PER_MODEL_TIMEOUT_MS,
            retries: { strategy: 'none' },
          }
        );
        lastModelError = null;
        break;
      } catch (err: any) {
        lastModelError = err;
        console.warn(
          `[Template Recreate] ${candidateModel} failed:`,
          err?.message || err
        );
        if (!isModelFallbackError(err)) {
          throw err;
        }
      }
    }

    if (!interaction) {
      throw lastModelError || new Error('Gemini vision models are momentarily busy. Please try again in a few seconds.');
    }

    const outputText = interaction.output_text?.trim();
    if (!outputText) {
      throw new Error('Gemini returned an empty template specification. Please try another file.');
    }

    const cleanedFence = outputText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const firstBrace = cleanedFence.indexOf('{');
    const lastBrace = cleanedFence.lastIndexOf('}');
    const jsonText =
      firstBrace !== -1 && lastBrace > firstBrace
        ? cleanedFence.slice(firstBrace, lastBrace + 1)
        : cleanedFence;

    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(jsonText);
    } catch {
      throw new Error('Failed to parse the AI template blueprint JSON.');
    }

    const template = normalizeCustomTemplateConfig(rawParsed);
    const endedAt = new Date();
    const durationSeconds = Math.max(
      1,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
    );

    // Log Gemini usage telemetry so Admin / Platform Monitor tracks AI template generation
    try {
      await VoiceUsageLog.create({
        userId: auth.session.userId,
        organizationId: auth.organization._id,
        documentType: 'template',
        modelName: modelUsed,
        status: 'ended',
        startedAt,
        endedAt,
        endReason: 'template_recreated',
        durationSeconds,
        promptTokenCount: interaction.usage?.total_input_tokens ?? 0,
        responseTokenCount: interaction.usage?.total_output_tokens ?? 0,
        thoughtsTokenCount: interaction.usage?.total_thought_tokens ?? 0,
        totalTokenCount: interaction.usage?.total_tokens ?? 0,
        toolCallCount: 0,
        turnCount: 1,
      });
    } catch {
      // Never block template recreation on telemetry write failure
    }

    return NextResponse.json({
      success: true,
      template,
      modelUsed,
    });
  } catch (error: any) {
    console.error('[Template Recreate Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to analyze and recreate template.',
      },
      { status: 500 }
    );
  }
}

