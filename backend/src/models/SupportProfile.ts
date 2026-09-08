import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal {
  _id: string;
  title: string;
  category: 'focus' | 'rest' | 'calm' | 'routine';
  targetMinutes?: number;
  createdAt: Date;
}

export interface ISupportProfile extends Document {
  userId: mongoose.Types.ObjectId;
  dailyRhythms: {
    wakeTime?: string;
    sleepTime?: string;
    peakEnergyTime?: 'morning' | 'afternoon' | 'evening' | 'late_night';
    highStressHours?: string[];
  };
  sensitivities: {
    overstimulationTriggers: string[];
    pressureTopics: string[];
  };
  preferredInterventionTypes: Array<'physical' | 'breathing' | 'task_breakdown' | 'reflective' | 'sensory_reset'>;
  communicationPreferences: {
    tone: 'gentle' | 'practical' | 'casual';
    responseLength: 'short' | 'balanced';
    language: 'banglish' | 'en' | 'bn';
  };
  goals: IGoal[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['focus', 'rest', 'calm', 'routine'],
    default: 'focus',
  },
  targetMinutes: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

const SupportProfileSchema = new Schema<ISupportProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dailyRhythms: {
      wakeTime: { type: String, default: '07:30' },
      sleepTime: { type: String, default: '23:30' },
      peakEnergyTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'late_night'],
        default: 'morning',
      },
      highStressHours: [{ type: String }],
    },
    sensitivities: {
      overstimulationTriggers: [{ type: String }],
      pressureTopics: [{ type: String }],
    },
    preferredInterventionTypes: [
      {
        type: String,
        enum: ['physical', 'breathing', 'task_breakdown', 'reflective', 'sensory_reset'],
      },
    ],
    communicationPreferences: {
      tone: {
        type: String,
        enum: ['gentle', 'practical', 'casual'],
        default: 'practical',
      },
      responseLength: {
        type: String,
        enum: ['short', 'balanced'],
        default: 'short',
      },
      language: {
        type: String,
        enum: ['banglish', 'en', 'bn'],
        default: 'banglish',
      },
    },
    goals: [GoalSchema],
  },
  {
    timestamps: true,
  }
);

export const SupportProfile = mongoose.model<ISupportProfile>('SupportProfile', SupportProfileSchema);
