import mongoose, { Document, Schema } from 'mongoose';

export type SafetyCategory = 'self_harm' | 'medical_diagnosis' | 'harm_to_others' | 'safe';
export type SafetySeverity = 'safe' | 'caution' | 'crisis';
export type SafetyActionTaken =
  | 'crisis_redirect'
  | 'clinical_boundary_disclaimer'
  | 'output_redacted'
  | 'allowed';

export interface ISafetyAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  category: SafetyCategory;
  severity: SafetySeverity;
  actionTaken: SafetyActionTaken;
  matchedRule?: string;
  createdAt: Date;
}

const SafetyAuditLogSchema = new Schema<ISafetyAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['self_harm', 'medical_diagnosis', 'harm_to_others', 'safe'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['safe', 'caution', 'crisis'],
      required: true,
    },
    actionTaken: {
      type: String,
      enum: ['crisis_redirect', 'clinical_boundary_disclaimer', 'output_redacted', 'allowed'],
      required: true,
    },
    matchedRule: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

SafetyAuditLogSchema.index({ userId: 1, createdAt: -1 });

export const SafetyAuditLog = mongoose.model<ISafetyAuditLog>(
  'SafetyAuditLog',
  SafetyAuditLogSchema
);
