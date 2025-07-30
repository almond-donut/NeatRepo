import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, X, Sparkles } from 'lucide-react';
import { useChatStore } from '@/stores';
import { useAIChat } from '@/hooks/dashboard';

interface AIChatPanelProps {
  repositories: any[];
  className?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ 
  repositories, 
  className = '' 
}) => {

  // Chat mode state and setter
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);

  const {
    messages,
    currentMessage,
    isTyping,
    isChatExpanded,
    setCurrentMessage,
    sendAIMessage,
    generateRepositoryAnalysis,
    toggleChat,
    clearChat,
    hasMessages,
    canSendMessage
  } = useAIChat();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canSendMessage) {
      await sendAIMessage(currentMessage, repositories);
    }
  };

  const handleGenerateAnalysis = async () => {
    await generateRepositoryAnalysis(repositories);
  };

  if (!isChatExpanded) {
    return (
      <Card className={`fixed bottom-4 right-4 w-80 shadow-lg ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChat}
              className="h-8 w-8 p-0"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 h-96 shadow-lg flex flex-col ${className}`}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </CardTitle>
          <div className="flex gap-1 items-center">
            {/* Mode Toggle */}
            <Button
              size="sm"
              variant={mode === 'critic' ? 'destructive' : 'outline'}
              className="text-xs px-2 py-1"
              onClick={() => setMode(mode === 'critic' ? 'nice' : 'critic')}
              title={mode === 'critic' ? 'Switch to Nice Mode' : 'Switch to Critic Mode'}
            >
              {mode === 'critic' ? 'Critic' : 'Nice'}
            </Button>
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-8 w-8 p-0"
                title="Clear chat"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChat}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-3 gap-3">
        {/* Quick Actions */}
        {!hasMessages && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateAnalysis}
              disabled={repositories.length === 0}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Analyze Repos
            </Button>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-xs">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask about your repositories..."
            className="flex-1 px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!canSendMessage}
            className="px-3"
          >
            <Send className="h-3 w-3" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
