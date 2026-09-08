import mongoose, { Document, Schema } from 'mongoose';

export type FeedbackRating = 'not_at_all' | 'a_little' | 'somewhat' | 'a_lot';

export const RATING_SCORES: Record<FeedbackRating, number> = {
  not_at_all: 1,
  a_little: 2,
  somewhat: 3,
  a_lot: 4,
};

export interface IInterventionFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  interventionId: mongoose.Types.ObjectId;
  interventionSlug: string;
  rating: FeedbackRating;
  ratingScore: number;
  perceivedShifts: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterventionFeedbackSchema = new Schema<IInterventionFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterventionSession', required: true, index: true },
    interventionId: { type: Schema.Types.ObjectId, ref: 'Intervention', required: true, index: true },
    interventionSlug: { type: String, required: true, index: true },
    rating: {
      type: String,
      enum: ['not_at_all', 'a_little', 'somewhat', 'a_lot'],
      required: true,
    },
    ratingScore: { type: Number, required: true },
    perceivedShifts: { type: [String], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

export const InterventionFeedback = mongoose.model<IInterventionFeedback>(
  'InterventionFeedback',
  InterventionFeedbackSchema
);
