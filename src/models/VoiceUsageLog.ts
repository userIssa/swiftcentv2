import mongoose, { Document, Model, Schema } from 'mongoose';

export type VoiceUsageStatus = 'provisioned' | 'active' | 'ended';

export interface IVoiceUsageLog extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  documentType: 'invoice' | 'quote' | 'template';
  modelName: string;
  status: VoiceUsageStatus;
  startedAt: Date;
  endedAt?: Date;
  endReason?: string;
  durationSeconds: number;
  promptTokenCount: number;
  responseTokenCount: number;
  thoughtsTokenCount: number;
  totalTokenCount: number;
  toolCallCount: number;
  turnCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const VoiceUsageLogSchema = new Schema<IVoiceUsageLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    documentType: { type: String, enum: ['invoice', 'quote', 'template'], default: 'quote' },
    modelName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['provisioned', 'active', 'ended'],
      default: 'provisioned',
      index: true,
    },
    startedAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date },
    endReason: { type: String, trim: true },
    durationSeconds: { type: Number, default: 0, min: 0 },
    promptTokenCount: { type: Number, default: 0, min: 0 },
    responseTokenCount: { type: Number, default: 0, min: 0 },
    thoughtsTokenCount: { type: Number, default: 0, min: 0 },
    totalTokenCount: { type: Number, default: 0, min: 0 },
    toolCallCount: { type: Number, default: 0, min: 0 },
    turnCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

VoiceUsageLogSchema.index({ createdAt: -1 });

const docTypePath = mongoose.models?.VoiceUsageLog?.schema?.path('documentType') as any;
const hasTemplateEnum =
  Array.isArray(docTypePath?.enumValues) && docTypePath.enumValues.includes('template');

export const VoiceUsageLog: Model<IVoiceUsageLog> =
  (mongoose.models && mongoose.models.VoiceUsageLog && hasTemplateEnum
    ? mongoose.models.VoiceUsageLog
    : null) ||
  (() => {
    if (mongoose.models && mongoose.models.VoiceUsageLog) {
      delete mongoose.models.VoiceUsageLog;
    }
    return mongoose.model<IVoiceUsageLog>('VoiceUsageLog', VoiceUsageLogSchema);
  })();

