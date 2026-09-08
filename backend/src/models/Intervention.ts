import mongoose, { Document, Schema } from 'mongoose';

export type InterventionCategory = 'calm' | 'focus' | 'grounding' | 'release' | 'rest';

export interface IInterventionStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationSeconds?: number;
}

export interface IIntervention extends Document {
  slug: string;
  title: string;
  shortDescription: string;
  category: InterventionCategory;
  durationSeconds: number;
  difficultyLevel: 'gentle' | 'moderate';
  steps: IInterventionStep[];
  tags: string[];
  suitableForTriggers: string[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterventionStepSchema = new Schema<IInterventionStep>(
  {
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    durationSeconds: { type: Number },
  },
  { _id: false }
);

const InterventionSchema = new Schema<IIntervention>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    category: {
      type: String,
      enum: ['calm', 'focus', 'grounding', 'release', 'rest'],
      required: true,
      index: true,
    },
    durationSeconds: { type: Number, required: true },
    difficultyLevel: {
      type: String,
      enum: ['gentle', 'moderate'],
      default: 'gentle',
    },
    steps: { type: [InterventionStepSchema], required: true },
    tags: { type: [String], default: [] },
    suitableForTriggers: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Intervention = mongoose.model<IIntervention>(
  'Intervention',
  InterventionSchema
);
