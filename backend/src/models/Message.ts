import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sender: 'user' | 'assistant';
  text: string;
  options: string[];
  suggestedActions: Array<{
    label: string;
    actionType: string;
    payload?: string;
  }>;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: [{ type: String }],
    suggestedActions: [
      {
        label: { type: String },
        actionType: { type: String },
        payload: { type: String },
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
