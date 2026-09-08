import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyProgress extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkinDone: boolean;
  smallActionDone: boolean;
  eveningReflectionDone: boolean;
  smallActionTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyProgressSchema = new Schema<IDailyProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    checkinDone: {
      type: Boolean,
      default: false,
    },
    smallActionDone: {
      type: Boolean,
      default: false,
    },
    eveningReflectionDone: {
      type: Boolean,
      default: false,
    },
    smallActionTitle: {
      type: String,
      default: 'One small action',
    },
  },
  {
    timestamps: true,
  }
);

DailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyProgress = mongoose.model<IDailyProgress>('DailyProgress', DailyProgressSchema);
