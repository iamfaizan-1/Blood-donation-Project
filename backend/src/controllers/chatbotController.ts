import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ChatbotService } from '../services/chatbotService.js';
import { sendResponse } from '../utils/response.js';
import { AppError } from '../utils/appError.js';

export const askChatbot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, history } = req.body;
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      throw new AppError('message must be a non-empty string of at most 2000 characters', 400);
    }

    if (history !== undefined && (!Array.isArray(history) || history.length > 10)) {
      throw new AppError('history must contain at most 10 messages', 400);
    }

    const safeHistory = (history || []).map((turn: unknown) => {
      if (
        !turn ||
        typeof turn !== 'object' ||
        !('role' in turn) ||
        !('content' in turn) ||
        !['user', 'assistant'].includes(String(turn.role)) ||
        typeof turn.content !== 'string' ||
        !turn.content.trim() ||
        turn.content.length > 2000
      ) {
        throw new AppError('history messages must have a valid role and content', 400);
      }
      return { role: turn.role as 'user' | 'assistant', content: turn.content.trim() };
    });

    const reply = await ChatbotService.getReply(message, safeHistory);
    sendResponse(res, 200, true, 'Chatbot reply generated', reply);
  } catch (error) {
    next(error);
  }
};
