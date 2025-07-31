import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Github, Send, ArrowUp, Square } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatSidebarProps {
  isMinimized: boolean;
  chatMessages: ChatMessage[];
  chatMessage: string;
  isAiThinking: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  setIsMinimized: (minimized: boolean) => void;
  setChatMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleResetChat: () => void;
}

const ThinkingSpinner = () => (
    <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-transparent rounded-full animate-spin"></div>
);
  

export function ChatSidebar({
  isMinimized,
  chatMessages,
  chatMessage,
  isAiThinking,
  chatEndRef,
  setIsMinimized,
  setChatMessage,
  handleSendMessage,
  handleResetChat
}: ChatSidebarProps) {
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={() => setIsMinimized(false)} className="w-14 h-14 rounded-full shadow-lg">
          <Github className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="sticky top-24 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium">AI Assistant</h2>
            <Button variant="ghost" size="sm" onClick={handleResetChat}>Reset</Button>
        </div>
      </CardHeader>
      <CardContent className="h-[60vh] flex flex-col">
        <ScrollArea className="flex-grow pr-2 mb-4">
          <div className="space-y-4">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs p-2 rounded-lg text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}>
                  {message.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                  <div className="bg-accent text-foreground p-2 rounded-lg text-sm flex items-center gap-2">
                      <ThinkingSpinner />
                      <span>AI is thinking...</span>
                  </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>
        <div className="flex gap-2">
            <Input
                placeholder={isAiThinking ? "AI is thinking..." : "Ask about your repos..."}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isAiThinking && handleSendMessage()}
                disabled={isAiThinking}
            />
            <Button onClick={handleSendMessage} size="sm" disabled={!chatMessage.trim() || isAiThinking}>
                <ArrowUp className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}