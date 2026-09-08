import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { defaultAIGateway } from '../services/ai/AIGateway';

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().optional(),
});

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { message: userText, conversationId } = sendMessageSchema.parse(req.body);

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.user._id,
        isActive: true,
      });
    }

    if (!conversation) {
      conversation = await Conversation.findOne({
        userId: req.user._id,
        isActive: true,
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user._id,
        isActive: true,
      });
    }

    // 1. Fetch recent messages for conversational context
    const recentMessages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(6);

    const conversationHistory = recentMessages
      .reverse()
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    // 2. Persist user message
    const userMessage = await Message.create({
      conversationId: conversation._id,
      userId: req.user._id,
      sender: 'user',
      text: userText,
      options: [],
      suggestedActions: [],
    });

    // 3. Process via AI Gateway (Context -> Signal Extraction -> Safety -> Response Gen)
    const aiResponse = await defaultAIGateway.processUserMessage({
      user: req.user,
      message: userText,
      conversationHistory,
    });

    // 4. Update conversation internal signals behind the scenes
    conversation.signals = {
      emotion: aiResponse.signals.emotion,
      context: aiResponse.signals.context,
      difficulty: aiResponse.signals.difficulty,
      urgency: aiResponse.signals.urgency,
    };
    await conversation.save();

    // 5. Persist assistant message
    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      userId: req.user._id,
      sender: 'assistant',
      text: aiResponse.text,
      options: aiResponse.options,
      suggestedActions: aiResponse.suggestedActions || [],
    });

    res.status(200).json({
      success: true,
      conversationId: conversation._id,
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      isActive: true,
    });

    if (!conversation) {
      res.status(200).json({
        success: true,
        conversation: null,
        messages: [],
      });
      return;
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

export const resetSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    await Conversation.updateMany(
      { userId: req.user._id, isActive: true },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation session reset',
    });
  } catch (error) {
    next(error);
  }
};
