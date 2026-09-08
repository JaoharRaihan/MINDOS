import mongoose, { Document, Schema } from 'mongoose';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface IInterventionSession extends Document {
  userId: mongoose.Types.ObjectId;
  interventionId: mongoose.Types.ObjectId;
  interventionSlug: string;
  startedAt: Date;
  completedAt?: Date;
  completedSteps: number;
  totalSteps: number;
  durationSpentSeconds: number;
  contextTrigger?: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const InterventionSessionSchema = new Schema<IInterventionSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    interventionId: { type: Schema.Types.ObjectId, ref: 'Intervention', required: true },
    interventionSlug: { type: String, required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    completedSteps: { type: Number, default: 0 },
    totalSteps: { type: Number, required: true },
    durationSpentSeconds: { type: Number, default: 0 },
    contextTrigger: { type: String },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
  },
  { timestamps: true }
);

export const InterventionSession = mongoose.model<IInterventionSession>(
  'InterventionSession',
  InterventionSessionSchema
);
