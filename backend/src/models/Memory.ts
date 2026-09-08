import mongoose, { Document, Schema } from 'mongoose';

export type MemoryType =
  | 'preference'
  | 'goal'
  | 'routine'
  | 'helpful_strategy'
  | 'user_context';

export interface IMemory extends Document {
  userId: mongoose.Types.ObjectId;
  type: MemoryType;
  content: string;
  source: 'onboarding' | 'checkin' | 'talk' | 'journal' | 'manual';
  confidence: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['preference', 'goal', 'routine', 'helpful_strategy', 'user_context'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    source: {
      type: String,
      enum: ['onboarding', 'checkin', 'talk', 'journal', 'manual'],
      default: 'manual',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MemorySchema.index({ userId: 1, isActive: 1 });

export const Memory = mongoose.model<IMemory>('Memory', MemorySchema);
