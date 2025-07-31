// lib/ai/actions/handleGeneralResponse.ts

import { AIResponse } from '../types';

export const handleGeneralResponse = async (): Promise<AIResponse> => {
  const helpMessage = `**AI Assistant Ready**\n\nI'm your GitHub repository assistant! I can help you with:\n\n**Repository Management:**\n• \"Create a new repo named [name]\"\n• \"Sort my repos by complexity\"\n\n**Analysis & Optimization:**\n• \"Analyze my repository complexity\"\n• \"Give me CV recommendations\"\n• \"Generate a portfolio README\"\n\n**Example:** \"Create a new repo named 'my-awesome-project'\"`

  return {
    message: helpMessage,
    success: true,
  };
};
