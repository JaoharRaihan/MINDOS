import mongoose, { Document, Schema } from 'mongoose';

export type TriageTrigger =
  | 'anxious'
  | 'racing_thoughts'
  | 'overwhelmed'
  | 'cant_focus'
  | 'low'
  | 'cant_sleep'
  | 'lonely'
  | 'dont_know';

export interface ITriageLog extends Document {
  userId: mongoose.Types.ObjectId;
  trigger: TriageTrigger;
  chosenAction?: 'talk' | 'calm' | 'journal' | 'focus' | 'human_support';
  createdAt: Date;
}

const TriageLogSchema = new Schema<ITriageLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trigger: {
      type: String,
      enum: [
        'anxious',
        'racing_thoughts',
        'overwhelmed',
        'cant_focus',
        'low',
        'cant_sleep',
        'lonely',
        'dont_know',
      ],
      required: true,
    },
    chosenAction: {
      type: String,
      enum: ['talk', 'calm', 'journal', 'focus', 'human_support'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const TriageLog = mongoose.model<ITriageLog>('TriageLog', TriageLogSchema);
