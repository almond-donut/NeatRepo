"use client"

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuthGuard } from "@/components/auth-guard";
import DashboardHeader from "@/components/dashboard-header";
import GitHubTokenWarning from "@/components/github-token-warning";
import { 
  JobTemplateModal
} from "@/components/dashboard";
import { useRepositories } from "@/hooks/dashboard";
import { useUIStore } from "@/stores";
import { useAuth } from "@/components/auth-provider";
import { aiAssistant } from "@/lib/ai-assistant";
import { geminiAI } from "@/lib/gemini";
import {
  Github,
  Star,
  MessageCircle,
  Square,
  ArrowUp,
  Lightbulb,
  Code,
  Zap,
  Target,
  Trash2
} from "lucide-react";

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic';

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Thinking spinner component
const ThinkingSpinner = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

export default function DashboardPage() {
  const { user, showTokenPopup } = useAuth();
  const { setJobTemplateModal } = useUIStore();
  
  const {
    repositories,
    isLoading,
    isError,
    hasRepositories,
    fetchRepositories,
    deleteRepository
  } = useRepositories();

  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [welcomeText, setWelcomeText] = useState("Welcome to your GitHub AI Assistant! 🤖");
  const [isTypingWelcome, setIsTypingWelcome] = useState(true);
  
  // Chat modes
  const [isCriticMode, setIsCriticMode] = useState(false);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState(new Set<number>());
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addChatMessage = (message: Omit<ChatMessage, 'timestamp'>) => {
    setChatMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
  };

  // Auto-fetch repositories when component mounts
  useEffect(() => {
    if (user) {
      fetchRepositories();
    }
  }, [user, fetchRepositories]);

  // Welcome message typing effect
  useEffect(() => {
    const fullWelcomeText = "Welcome to your GitHub AI Assistant! 🤖\n\nI can help you with:\n• Repository analysis and suggestions\n• README generation\n• Portfolio interviews\n• Critic mode for honest feedback\n• Job template creation";
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullWelcomeText.length) {
        setWelcomeText(fullWelcomeText.slice(0, i + 1));
        i++;
      } else {
        setIsTypingWelcome(false);
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiThinking]);

  const sendDirectMessage = async (message: string) => {
    if (!message.trim()) return;

    addChatMessage({
      id: Date.now().toString(),
      role: "user",
      content: message
    });

    setIsAiThinking(true);

    try {
      // Check for special commands
      if (message.toLowerCase().includes('brutal feedback') || message.toLowerCase().includes('critic mode')) {
        setIsCriticMode(true);
      }
      
      if (message.toLowerCase().includes('interview') && message.toLowerCase().includes('portfolio')) {
        setIsInterviewMode(true);
      }

      // Get AI response (simplified for now)
      let response = "I understand you want help with your repositories. ";
      
      if (isCriticMode) {
        response += "In critic mode, I'll give you brutally honest feedback. ";
      }
      
      if (isInterviewMode) {
        response += "Let's start the portfolio interview. What's your primary programming focus?";
      } else {
        response += "How can I help you improve your GitHub portfolio today?";
      }

      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response
      });
    } catch (error) {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendMessage = async () => {
    await sendDirectMessage(chatMessage);
    setChatMessage("");
  };

  const handleResetChat = () => {
    if (window.confirm('Reset the chat and exit all modes?')) {
      setChatMessages([]);
      setIsCriticMode(false);
      setIsInterviewMode(false);
      setIsTypingWelcome(true);
      setWelcomeText("Welcome to your GitHub AI Assistant! 🤖");
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedRepos(new Set());
    }
  };

  const toggleRepoSelection = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleRefresh = () => {
    fetchRepositories(true);
  };

  const handleJobTemplateOpen = () => {
    setJobTemplateModal(true);
  };

  const handleDeleteRepository = async (repo: any) => {
    await deleteRepository(repo.id);
  };

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        {showTokenPopup && <GitHubTokenWarning onSetupToken={() => {}} />}
        
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Repository Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{repositories.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Stars</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-red-600">⚠️</div>
                      <div>
                        <h3 className="font-medium text-red-800">Error loading repositories</h3>
                        <p className="text-sm text-red-600">Please try refreshing the page.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="ml-auto"
                      >
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Star className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleJobTemplateOpen}
                    className="flex items-center gap-2"
                    title="Generate job-specific portfolio template"
                  >
                    <Target className="h-4 w-4" />
                    Job Template
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant={isDeleteMode ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleDeleteMode}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleteMode ? "Exit Delete Mode" : "Enter Delete Mode"}
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {repositories.length === 0 ? (
                        isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="flex items-center space-x-2">
                              <Star className="h-5 w-5 animate-spin" />
                              <span>Loading repositories...</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Github className="h-16 w-16 text-muted-foreground" />
                            <div className="text-center">
                              <h3 className="text-xl font-semibold mb-2">Welcome to NeatRepo! 🎉</h3>
                              <p className="text-muted-foreground">
                                Connect your GitHub account to see your repositories
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        repositories.map((repo, index) => (
                          <div
                            key={repo.id}
                            className="p-3 rounded-lg bg-card border border-border/50 hover:border-border hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {isDeleteMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedRepos.has(repo.id)}
                                    onChange={() => toggleRepoSelection(repo.id)}
                                    className="w-4 h-4 text-destructive bg-background border-border rounded focus:ring-destructive focus:ring-2"
                                  />
                                )}
                                <Github className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold">{repo.name}</span>
                                    {repo.private && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                        Private
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {repo.description || "No description"}
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-3 w-3" />
                                      <span>{repo.stargazers_count}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span>{repo.language}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* AI Chat Panel */}
            <div className="lg:col-span-1">
              {!isChatMinimized ? (
                <Card className="sticky top-6 shadow-lg border-gray-700/50">
                  <CardHeader className="flex flex-row items-center justify-between bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"></button>
                        <button onClick={() => setIsChatMinimized(true)} className="w-3 h-3 bg-yellow-400 rounded-full hover:bg-yellow-500"></button>
                        <button className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600"></button>
                      </div>
                      <h2 className="text-sm font-medium text-gray-300">
                        AI Assistant
                        {isCriticMode && <span className="text-red-400"> • Critic Mode</span>}
                        {isInterviewMode && <span className="text-yellow-400"> • Interview Mode</span>}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCriticMode(!isCriticMode)}
                        className={`text-xs ${isCriticMode ? 'text-red-400 bg-red-500/20' : 'text-gray-400'}`}
                      >
                        {isCriticMode ? '🔥' : '😊'} {isCriticMode ? 'Brutal' : 'Nice'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetChat}
                        className="text-xs text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30"
                        title="Reset chat & exit all modes"
                      >
                        🔄 Reset
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 h-[60vh] flex flex-col">
                    <div className="flex-grow overflow-hidden">
                      <ScrollArea className="h-full pr-2">
                        <div className="space-y-4">
                          {/* Welcome Message */}
                          <div className="flex justify-start">
                            <div className="bg-accent text-foreground border border-border p-2 rounded-lg text-sm">
                              {welcomeText}
                              {isTypingWelcome && <span className="animate-pulse">|</span>}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          {!isTypingWelcome && chatMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Github className="h-16 w-16 text-gray-600 mb-4" />
                              <div className="flex flex-col gap-3 text-sm max-w-sm mx-auto">
                                <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start bg-transparent text-xs px-2 py-1 h-8"
                                    onClick={() => sendDirectMessage("analyze my repository structure")}
                                    disabled={isAiThinking}
                                  >
                                    <Code className="h-3 w-3 mr-1.5" />
                                    Analyze Structure
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start bg-foreground text-background hover:bg-foreground/90 border-0 text-xs px-2 py-1 h-8"
                                    onClick={() => sendDirectMessage("give me suggestions to improve my repositories")}
                                    disabled={isAiThinking}
                                  >
                                    <Lightbulb className="h-3 w-3 mr-1.5" />
                                    Get Suggestions
                                  </Button>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 text-xs px-2 py-1 h-8"
                                  onClick={() => sendDirectMessage("start interview for personalized portfolio README")}
                                  disabled={isAiThinking || repositories.length === 0 || isInterviewMode}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1.5" />
                                  {isInterviewMode ? 'Interview Active...' : 'Generate Portfolio README'}
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 text-xs px-2 py-1 h-8"
                                  onClick={() => sendDirectMessage("brutal feedback on my repositories")}
                                  disabled={isAiThinking}
                                >
                                  🔥 Brutal Feedback
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Chat Messages */}
                          <div className="space-y-3">
                            {chatMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-xs p-2 rounded-lg text-sm ${
                                    message.role === "user"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-accent text-foreground border border-border"
                                  }`}
                                >
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
                        </div>
                      </ScrollArea>
                    </div>

                    {!isTypingWelcome && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder={isAiThinking ? "AI is thinking..." : "Ask about your repositories..."}
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && !isAiThinking && handleSendMessage()}
                            disabled={isAiThinking}
                            className="bg-background border-border"
                          />
                          <Button
                            onClick={isAiThinking ? () => setIsAiThinking(false) : handleSendMessage}
                            size="sm"
                            disabled={!isAiThinking && !chatMessage.trim()}
                            className={isAiThinking
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-white hover:bg-gray-100 text-black border border-gray-300"
                            }
                          >
                            {isAiThinking ? (
                              <Square className="h-3 w-3 fill-current" />
                            ) : (
                              <ArrowUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Minimized Chat Bubble */
                <div className="fixed bottom-6 right-6 z-50">
                  <Button
                    onClick={() => setIsChatMinimized(false)}
                    className="w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 shadow-lg border border-gray-700"
                  >
                    <Github className="h-6 w-6 text-white" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Template Modal */}
        <JobTemplateModal repositories={repositories} />
      </div>
    </AuthGuard>
  );
}
