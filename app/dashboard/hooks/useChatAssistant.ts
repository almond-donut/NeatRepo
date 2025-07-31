// app/dashboard/hooks/useChatAssistant.ts
"use client"

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { aiAssistant } from "@/lib/ai-assistant";
import { GitHubRepo, ChatMessage } from "../types";

export function useChatAssistant(repositories: GitHubRepo[]) {
  const { user } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isCriticMode, setIsCriticMode] = useState(false);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  const [welcomeText, setWelcomeText] = useState("");
  const [isTypingWelcome, setIsTypingWelcome] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const WELCOME_FULL_TEXT = "Hi! I'm your AI assistant. Ask me anything about your repositories, or use the quick actions below to get started.";

  // Update AI assistant context whenever repositories change
  useEffect(() => {
    aiAssistant.updateUserContext({ repositories });
  }, [repositories]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (chatMessages.length === 0) {
      setWelcomeText("");
      setIsTypingWelcome(true);
      let i = 0;
      const type = () => {
        if (i < WELCOME_FULL_TEXT.length) {
          setWelcomeText(prev => WELCOME_FULL_TEXT.slice(0, i + 1));
          i++;
          timeout = setTimeout(type, 18);
        } else {
          setIsTypingWelcome(false);
        }
      };
      type();
    }
    return () => clearTimeout(timeout);
  }, [chatMessages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);
  
  const addChatMessage = (message: Omit<ChatMessage, 'timestamp' | 'id'>) => {
    setChatMessages(prev => [...prev, { ...message, id: Date.now().toString(), timestamp: new Date() }]);
  };

  const processMessage = async (currentMessage: string) => {
    // The AI assistant context is already updated via useEffect when repositories change
    // Process the message using the AI assistant
    const response = await aiAssistant.processMessage(currentMessage);
    
    addChatMessage({ role: "assistant", content: response.message });

    if (response.data?.portfolioReadme) {
      setGeneratedReadme(response.data.portfolioReadme);
    }
    if (response.data?.interviewActive !== undefined) {
      setIsInterviewMode(response.data.interviewActive);
    }
    if (response.data?.progress !== undefined) {
      setInterviewProgress(response.data.progress);
    }
    setIsAiThinking(false);
  };

  const sendDirectMessage = async (message: string) => {
    if (!message.trim()) return;
    addChatMessage({ role: "user", content: message });
    setIsAiThinking(true);
    await processMessage(message);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const currentMessage = chatMessage;
    setChatMessage("");
    await sendDirectMessage(currentMessage);
  };
  
  const handleResetChat = () => {
    setChatMessages([]);
    setIsInterviewMode(false);
    setInterviewProgress(0);
    setGeneratedReadme(null);
  };
  
  const downloadPortfolioReadme = () => {
    if (!generatedReadme) return;
    const blob = new Blob([generatedReadme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PORTFOLIO_README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReadme = async (repo: GitHubRepo) => {
     // This function can be expanded with more logic if needed.
    await sendDirectMessage(`Generate a README for my repository: ${repo.name}`);
  };

  return {
    chatMessage,
    setChatMessage,
    chatMessages,
    addChatMessage,
    isAiThinking,
    handleSendMessage,
    sendDirectMessage,
    chatEndRef,
    // Welcome Text
    welcomeText,
    isTypingWelcome,
    // Modes & Features
    isCriticMode,
    setIsCriticMode,
    isInterviewMode,
    interviewProgress,
    generatedReadme,
    handleResetChat,
    downloadPortfolioReadme,
    generateReadme
  };
}