import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { Client } from '@/models/Client';
import { Product } from '@/models/Product';
import { VoiceUsageLog } from '@/models/VoiceUsageLog';
import { formatCurrency } from '@/engine/calculator';
import { resolveAuthorizedOrganization } from '@/lib/voice/server-auth';
import {
  buildVoiceSystemInstruction,
  GEMINI_LIVE_MODEL,
  VOICE_DRAFT_TOOLS,
} from '@/lib/voice/tool-declarations';
import { VoiceDocumentType } from '@/lib/voice/types';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const organizationId = typeof body.organizationId === 'string' ? body.organizationId : null;
    const documentType: VoiceDocumentType =
      body.documentType === 'invoice' ? 'invoice' : 'quote';

    const auth = await resolveAuthorizedOrganization(organizationId);
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
            'GEMINI_API_KEY is not configured on the server. Add it to .env.local to activate live voice drafting.',
        },
        { status: 503 }
      );
    }

    const org = auth.organization;
    const defaultCurrency = org.currency || 'USD';

    // Pull compact tenant directory snapshot to ground system instructions & minimize ambiguity
    const [clients, products] = await Promise.all([
      Client.find({ organizationId: org._id }).select('name email').sort({ name: 1 }).limit(30).lean(),
      Product.find({ organizationId: org._id })
        .select('name unitPriceCents taxRate')
        .sort({ name: 1 })
        .limit(40)
        .lean(),
    ]);

    const todayIso = new Date().toISOString().split('T')[0];
    const systemInstruction = buildVoiceSystemInstruction({
      organizationName: org.name,
      defaultCurrency,
      documentType,
      todayIso,
      sampleClients: clients.map((c) => ({ name: c.name, email: c.email })),
      sampleProducts: products.map((p) => ({
        name: p.name,
        priceDisplay: formatCurrency(p.unitPriceCents, defaultCurrency),
        taxRate: p.taxRate ?? 0,
      })),
    });

    const serverAi = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    const nowMs = Date.now();
    const newSessionExpireTime = new Date(nowMs + 3 * 60 * 1000).toISOString();
    const expireTime = new Date(nowMs + 10 * 60 * 1000).toISOString();

    const authToken = await serverAi.authTokens.create({
      config: {
        uses: 1,
        newSessionExpireTime,
        expireTime,
        liveConnectConstraints: {
          model: GEMINI_LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            temperature: 0.2,
            maxOutputTokens: 350,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Kore',
                },
              },
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            tools: VOICE_DRAFT_TOOLS,
            contextWindowCompression: {
              triggerTokens: '12000',
              slidingWindow: {
                targetTokens: '4000',
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        // Lock the constraints above while permitting client-supplied sessionResumption.handle on reconnects
        lockAdditionalFields: [],
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    if (!authToken?.name) {
      throw new Error('Ephemeral token response was empty');
    }

    const usageLog = await VoiceUsageLog.create({
      userId: auth.session.userId,
      organizationId: org._id,
      documentType,
      modelName: GEMINI_LIVE_MODEL,
      status: 'provisioned',
      startedAt: new Date(nowMs),
    });

    return NextResponse.json({
      success: true,
      token: authToken.name,
      usageLogId: usageLog._id.toString(),
      model: GEMINI_LIVE_MODEL,
      expireTime,
      organizationId: org._id.toString(),
      organizationName: org.name,
      currency: defaultCurrency,
    });
  } catch (err: any) {
    console.error('Voice session provisioning error:', err);
    return NextResponse.json(
      {
        success: false,
        code: 'UPSTREAM_ERROR',
        error: err?.message || 'Unable to provision Gemini Live session token',
      },
      { status: 502 }
    );
  }
}

