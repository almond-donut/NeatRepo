// app/dashboard/components/ChatSidebar.tsx
"use client"

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitHubRepo, ChatMessage } from '../types';
import { Github, Send, ArrowUp, Square, Code, Lightbulb, Zap, MessageCircle, Download } from 'lucide-react';

// Props Interface for the component
interface ChatSidebarProps {
  isMinimized: boolean;
  isCriticMode: boolean;
  isInterviewMode: boolean;
  interviewProgress: number;
  generatedReadme: string | null;
  chatMessages: ChatMessage[];
  chatMessage: string;
  isAiThinking: boolean;
  welcomeText: string;
  isTypingWelcome: boolean;
  repositories: GitHubRepo[];
  chatEndRef: React.RefObject<HTMLDivElement>;
  setIsMinimized: (minimized: boolean) => void;
  setIsCriticMode: (critic: boolean) => void;
  setChatMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleResetChat: () => void;
  downloadPortfolioReadme: () => void;
  sendDirectMessage: (message: string) => void;
  generateReadme: (repo: GitHubRepo) => void;
}

const ThinkingSpinner = () => (
    <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-transparent rounded-full animate-spin"></div>
);

export function ChatSidebar({
  isMinimized, isCriticMode, isInterviewMode, interviewProgress, generatedReadme,
  chatMessages, chatMessage, isAiThinking, welcomeText, isTypingWelcome, repositories,
  chatEndRef, setIsMinimized, setIsCriticMode, setChatMessage, handleSendMessage,
  handleResetChat, downloadPortfolioReadme, sendDirectMessage, generateReadme
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
    <Card className="shadow-lg border-gray-700/50">
      {/* --- RESTORED HEADER --- */}
      <CardHeader className="flex flex-row items-center justify-between bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 p-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button onClick={() => {}} className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"></button>
            <button onClick={() => setIsMinimized(true)} className="w-3 h-3 bg-yellow-400 rounded-full hover:bg-yellow-500"></button>
            <button className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600"></button>
          </div>
          <h2 className="text-sm font-medium text-gray-300">
            AI Assistant
            {isCriticMode && <span className="text-red-400"> • Critic Mode</span>}
            {isInterviewMode && <span className="text-blue-400"> • Interview Mode</span>}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsCriticMode(!isCriticMode)} className={`text-xs ${isCriticMode ? 'text-red-400 bg-red-500/20' : 'text-gray-400'}`}>
            {isCriticMode ? '🔥' : '😊'} {isCriticMode ? 'Brutal' : 'Nice'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetChat} className="text-xs text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30">
            🔄 Reset
          </Button>
          {generatedReadme && (
            <Button variant="ghost" size="sm" onClick={downloadPortfolioReadme} className="text-xs text-green-400 bg-green-500/20 hover:bg-green-500/30">
              <Download className="h-3 w-3 mr-1.5" /> README
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 h-[60vh] flex flex-col">
        <ScrollArea className="flex-grow overflow-hidden pr-2">
          <div className="space-y-4">
            {/* --- RESTORED WELCOME AND PROMPT STARTER BLOCK --- */}
            <div className="flex justify-start">
              <div className="bg-accent text-foreground border border-border p-2 rounded-lg text-sm">
                {welcomeText}
                {isTypingWelcome && <span className="animate-pulse">|</span>}
              </div>
            </div>
            {!isTypingWelcome && chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Github className="h-16 w-16 text-gray-600 mb-4" />
                <div className="flex flex-col gap-3 text-sm max-w-sm mx-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => sendDirectMessage("analyze my repository structure")} disabled={isAiThinking}>
                      <Code className="h-3 w-3 mr-1.5" /> Analyze Structure
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-foreground text-background hover:bg-foreground/90 border-0 text-xs h-8" onClick={() => repositories.length > 0 && generateReadme(repositories[0])} disabled={isAiThinking || repositories.length === 0}>
                      <Zap className="h-3 w-3 mr-1.5" /> Quick README
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => sendDirectMessage("give me suggestions to improve my repositories")} disabled={isAiThinking}>
                    <Lightbulb className="h-3 w-3 mr-1.5" /> Get Suggestions
                  </Button>
                  <div className="border-t border-border pt-2 mt-2">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 text-xs h-8" onClick={() => sendDirectMessage("start interview for personalized portfolio README")} disabled={isAiThinking || repositories.length === 0 || isInterviewMode}>
                      <MessageCircle className="h-3 w-3 mr-1.5" /> {isInterviewMode ? 'Interview Active...' : 'Generate Portfolio README'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`whitespace-pre-wrap max-w-xs p-2 rounded-lg text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-foreground border border-border"}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                  <div className="bg-accent text-foreground border border-border p-2 rounded-lg text-sm flex items-center gap-2">
                      <ThinkingSpinner />
                      <span>AI is thinking...</span>
                  </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-4">
            <Input
                placeholder={isAiThinking ? "AI is thinking..." : "Ask about your repositories..."}
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