// lib/ai/types.ts

import { GitHubRepo } from "@/app/dashboard/types";

// The context of the user, including their repos, preferences, and chat history
export interface UserProfile {
  name?: string;
  bio?: string;
  techStack?: string[];
  interests?: string[];
}

// Represents a single entry in the conversation history
export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// The context of the user, including their repos, preferences, and chat history
export interface InterviewQuestion {
  id: string;
  question: string;
}

export interface InterviewState {
  isActive: boolean;
  currentQuestion: number;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
}

export interface UserContext {
  repositories: GitHubRepo[];
  conversationHistory: ConversationEntry[];
  preferences: Record<string, any>;
  userProfile?: UserProfile | null;
  githubAccessToken?: string;
  githubUsername?: string;
  interviewState?: InterviewState;
}

// The action parsed from the user's message
export interface AIAction {
  type: string;
  intent: string;
  parameters: any;
  confidence: number;
}

// The response from the AI after executing an action
export interface AIResponse {
  message: string;
  success: boolean;
  action?: AIAction;
  data?: any;
}
