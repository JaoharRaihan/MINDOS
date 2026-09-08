import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  summary?: string;
  signals?: {
    emotion?: string;
    context?: string;
    difficulty?: string;
    urgency?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    summary: {
      type: String,
    },
    signals: {
      emotion: { type: String },
      context: { type: String },
      difficulty: { type: String },
      urgency: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, isActive: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
