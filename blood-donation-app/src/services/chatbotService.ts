import apiClient from './api';

export interface ChatbotReply {
  intent: string;
  reply: string;
  suggestedReplies?: string[];
}

export interface ChatbotTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const chatbotService = {
  async ask(message: string, history: ChatbotTurn[] = []): Promise<ChatbotReply> {
    const response = await apiClient.post('/chatbot/ask', { message, history });
    return response.data.data;
  },
};
