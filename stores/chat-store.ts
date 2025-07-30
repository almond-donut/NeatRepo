import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ChatMessage, LoadingState } from './types';

interface ChatState {
  // Chat data
  messages: ChatMessage[];
  currentMessage: string;
  
  // Loading state
  isLoadingChat: LoadingState;
  isTyping: boolean;
  
  // UI state
  isChatExpanded: boolean;
  
  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setCurrentMessage: (message: string) => void;
  setChatLoading: (state: LoadingState) => void;
  setTyping: (typing: boolean) => void;
  setChatExpanded: (expanded: boolean) => void;
  clearChat: () => void;
  
  // Complex actions
  sendMessage: (content: string, userId?: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    messages: [],
    currentMessage: '',
    isLoadingChat: 'idle',
    isTyping: false,
    isChatExpanded: false,
    
    // Basic setters
    setMessages: (messages) => set({ messages }),
    setCurrentMessage: (message) => set({ currentMessage: message }),
    setChatLoading: (state) => set({ isLoadingChat: state }),
    setTyping: (typing) => set({ isTyping: typing }),
    setChatExpanded: (expanded) => set({ isChatExpanded: expanded }),
    
    // Add message
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, message]
    })),
    
    // Clear chat
    clearChat: () => set({
      messages: [],
      currentMessage: '',
      isLoadingChat: 'idle',
      isTyping: false
    }),
    
    // Send message (complex action)
    sendMessage: async (content: string, userId?: string) => {
      const { addMessage, setChatLoading, setTyping, setCurrentMessage } = get();
      
      if (!content.trim()) return;
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      };
      
      addMessage(userMessage);
      setCurrentMessage('');
      setChatLoading('loading');
      setTyping(true);
      
      try {
        // Here you would integrate with your AI service
        // For now, this is a placeholder
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: content,
            userId,
            history: get().messages.slice(-10) // Send last 10 messages for context
          })
        });
        
        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || 'Sorry, I couldn\'t process that request.',
          timestamp: new Date()
        };
        
        addMessage(assistantMessage);
        setChatLoading('success');
      } catch (error) {
        console.error('Chat error:', error);
        
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date()
        };
        
        addMessage(errorMessage);
        setChatLoading('error');
      } finally {
        setTyping(false);
      }
    }
  }))
);
