import { useCallback } from 'react';
import { useChatStore, useErrorStore } from '@/stores';
import { useAuth } from '@/components/auth-provider';
import { aiAssistant } from '@/lib/ai-assistant';
import { geminiAI } from '@/lib/gemini';

/**
 * Custom hook for AI chat functionality
 */
export const useAIChat = () => {
  const { user, getEffectiveToken } = useAuth();
  const { 
    messages, 
    currentMessage, 
    isLoadingChat, 
    isTyping,
    isChatExpanded,
    setCurrentMessage, 
    sendMessage,
    setChatExpanded,
    clearChat 
  } = useChatStore();
  const { addCriticalError } = useErrorStore();

  // Send a message to AI with proper error handling
  const sendAIMessage = useCallback(async (message: string, repositories?: any[]) => {
    if (!message.trim()) {
      return;
    }

    try {
      // Get effective token for AI context
      const token = await getEffectiveToken();
      
      // Prepare context for AI
      const context = {
        userId: user?.id,
        repositories: repositories || [],
        token: token,
        previousMessages: messages.slice(-5) // Last 5 messages for context
      };

      // Use the chat store's sendMessage which handles the API call
      await sendMessage(message, user?.id);

    } catch (error) {
      console.error('Error sending AI message:', error);
      addCriticalError(
        error instanceof Error ? error.message : 'Failed to send message to AI assistant',
        'AI_CHAT_ERROR'
      );
    }
  }, [user, messages, getEffectiveToken, sendMessage, addCriticalError]);

  // Generate AI analysis for repositories
  const generateRepositoryAnalysis = useCallback(async (repositories: any[]) => {
    if (!repositories || repositories.length === 0) {
      addCriticalError('No repositories available for analysis', 'NO_REPOS');
      return;
    }

    try {
      const analysisPrompt = `Please analyze my GitHub repositories and provide insights about:
1. Programming language distribution
2. Project complexity levels
3. Recent activity patterns
4. Recommendations for improvement
5. Suggestions for showcasing these projects

Repositories: ${repositories.map(repo => `${repo.name} (${repo.language || 'Unknown'}, ${repo.stargazers_count} stars)`).join(', ')}`;

      await sendAIMessage(analysisPrompt, repositories);

    } catch (error) {
      console.error('Error generating repository analysis:', error);
      addCriticalError('Failed to generate repository analysis', 'ANALYSIS_ERROR');
    }
  }, [sendAIMessage, addCriticalError]);

  // Generate job-specific recommendations
  const generateJobRecommendations = useCallback(async (jobTitle: string, repositories: any[]) => {
    if (!jobTitle.trim()) {
      addCriticalError('Job title is required for recommendations', 'MISSING_JOB_TITLE');
      return;
    }

    try {
      const jobPrompt = `I'm applying for a ${jobTitle} position. Based on my repositories, please:
1. Recommend which repositories to highlight for this role
2. Suggest improvements to make my profile more attractive
3. Identify any gaps in my skill set
4. Provide specific talking points for interviews

My repositories: ${repositories.map(repo => `${repo.name} (${repo.language || 'Unknown'}, ${repo.description || 'No description'})`).join(', ')}`;

      await sendAIMessage(jobPrompt, repositories);

    } catch (error) {
      console.error('Error generating job recommendations:', error);
      addCriticalError('Failed to generate job recommendations', 'JOB_REC_ERROR');
    }
  }, [sendAIMessage, addCriticalError]);

  // Toggle chat panel
  const toggleChat = useCallback(() => {
    setChatExpanded(!isChatExpanded);
  }, [isChatExpanded, setChatExpanded]);

  return {
    // State
    messages,
    currentMessage,
    isLoadingChat,
    isTyping,
    isChatExpanded,
    
    // Actions
    setCurrentMessage,
    sendAIMessage,
    generateRepositoryAnalysis,
    generateJobRecommendations,
    toggleChat,
    clearChat,
    
    // Computed
    hasMessages: messages.length > 0,
    canSendMessage: currentMessage.trim().length > 0 && isLoadingChat !== 'loading'
  };
};
