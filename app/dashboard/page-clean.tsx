"use client"

import React from "react";
import { AuthGuard } from "@/components/auth-guard";
import DashboardHeader from "@/components/dashboard-header";
import GitHubTokenWarning from "@/components/github-token-warning";
import { 
  AIChatPanel,
  RepositoryActions,
  RepositoryList,
  ErrorDisplay,
  JobTemplateModal
} from "@/components/dashboard";
import { useRepositories, useDragAndDrop, useAIChat } from "@/hooks/dashboard";
import { useUIStore } from "@/stores";
import { useAuth } from "@/components/auth-provider";

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user, showTokenPopup } = useAuth();
  const { jobTemplateModalOpen, setJobTemplateModal } = useUIStore();
  
  const {
    repositories,
    isLoading,
    error,
    hasRepositories,
    fetchRepositories,
    deleteRepository,
    refreshRepositories
  } = useRepositories();

  const {
    dragHandlers,
    sortRepositories,
    resetOrder
  } = useDragAndDrop(repositories);

  const {
    messages,
    isTyping,
    isChatExpanded,
    isCriticMode,
    isInterviewMode,
    sendMessage,
    toggleCriticMode,
    toggleChat,
    clearChat
  } = useAIChat();

  const handleRefresh = () => {
    refreshRepositories();
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
        
        {showTokenPopup && <GitHubTokenWarning />}
        
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Repository Management */}
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <ErrorDisplay 
                  error={error} 
                  onRetry={handleRefresh}
                />
              )}
              
              <RepositoryActions
                onRefresh={handleRefresh}
                onJobTemplate={handleJobTemplateOpen}
                isLoading={isLoading}
                repositoryCount={repositories.length}
              />
              
              <RepositoryList
                repositories={repositories}
                isLoading={isLoading}
                dragHandlers={dragHandlers}
                onSort={sortRepositories}
                onResetOrder={resetOrder}
                onDelete={handleDeleteRepository}
                hasRepositories={hasRepositories}
              />
            </div>

            {/* AI Chat Panel */}
            <div className="lg:col-span-1">
              <AIChatPanel
                repositories={repositories}
                messages={messages}
                isTyping={isTyping}
                isChatExpanded={isChatExpanded}
                isCriticMode={isCriticMode}
                isInterviewMode={isInterviewMode}
                onSendMessage={sendMessage}
                onToggleCritic={toggleCriticMode}
                onToggleChat={toggleChat}
                onClearChat={clearChat}
                className="sticky top-6"
              />
            </div>
          </div>
        </div>

        {/* Job Template Modal */}
        {jobTemplateModalOpen && (
          <JobTemplateModal
            repositories={repositories}
            onClose={() => setJobTemplateModal(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
