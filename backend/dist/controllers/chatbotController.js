"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askChatbot = void 0;
const chatbotService_js_1 = require("../services/chatbotService.js");
const response_js_1 = require("../utils/response.js");
const appError_js_1 = require("../utils/appError.js");
const askChatbot = async (req, res, next) => {
    try {
        const { message, history } = req.body;
        if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
            throw new appError_js_1.AppError('message must be a non-empty string of at most 2000 characters', 400);
        }
        if (history !== undefined && (!Array.isArray(history) || history.length > 10)) {
            throw new appError_js_1.AppError('history must contain at most 10 messages', 400);
        }
        const safeHistory = (history || []).map((turn) => {
            if (!turn ||
                typeof turn !== 'object' ||
                !('role' in turn) ||
                !('content' in turn) ||
                !['user', 'assistant'].includes(String(turn.role)) ||
                typeof turn.content !== 'string' ||
                !turn.content.trim() ||
                turn.content.length > 2000) {
                throw new appError_js_1.AppError('history messages must have a valid role and content', 400);
            }
            return { role: turn.role, content: turn.content.trim() };
        });
        const reply = await chatbotService_js_1.ChatbotService.getReply(message, safeHistory);
        (0, response_js_1.sendResponse)(res, 200, true, 'Chatbot reply generated', reply);
    }
    catch (error) {
        next(error);
    }
};
exports.askChatbot = askChatbot;
