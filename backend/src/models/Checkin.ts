import mongoose, { Document, Schema } from 'mongoose';

export type MoodType = 'great' | 'neutral' | 'down' | 'overwhelmed' | 'exhausted';

export interface ICheckin extends Document {
  userId: mongoose.Types.ObjectId;
  mood: MoodType;
  energyLevel?: number; // 1 to 5
  tags: string[];
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

const CheckinSchema = new Schema<ICheckin>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mood: {
      type: String,
      enum: ['great', 'neutral', 'down', 'overwhelmed', 'exhausted'],
      required: true,
    },
    energyLevel: {
      type: Number,
      min: 1,
      max: 5,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure fast retrieval by user and date
CheckinSchema.index({ userId: 1, date: 1 });

export const Checkin = mongoose.model<ICheckin>('Checkin', CheckinSchema);
