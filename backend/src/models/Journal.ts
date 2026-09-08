import mongoose, { Document, Schema } from 'mongoose';

export interface IAIReflection {
  text: string;
  suggestedExploration?: string;
  generatedAt: Date;
}

export interface IJournal extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'voice';
  audioDurationSeconds?: number;
  aiReflection?: IAIReflection;
  isPrivate: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AIReflectionSchema = new Schema<IAIReflection>({
  text: { type: String, required: true },
  suggestedExploration: { type: String },
  generatedAt: { type: Date, default: Date.now },
});

const JournalSchema = new Schema<IJournal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    audioDurationSeconds: {
      type: Number,
    },
    aiReflection: AIReflectionSchema,
    isPrivate: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

JournalSchema.index({ userId: 1, createdAt: -1 });

export const Journal = mongoose.model<IJournal>('Journal', JournalSchema);
