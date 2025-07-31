// app/dashboard/page.tsx
"use client"

import React from 'react';
import { useDashboard } from './hooks/useDashboard';
import { RepositoryList } from './components/RepositoryList';
import { ChatSidebar } from './components/ChatSidebar';
import { DashboardMetrics } from './components/DashboardMetrics';
import { ActionButtons } from './components/ActionButtons';
import { Modals } from './components/Modals';
import DashboardHeader from '@/components/dashboard-header';
import GitHubTokenWarning from '@/components/github-token-warning';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Getting ready...</p>
        </div>
      </div>
    );
  }

  const forkedRepos = dashboard.repositories.filter(repo => repo.fork);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {!dashboard.profile?.github_pat_token && <GitHubTokenWarning onSetupToken={dashboard.showTokenPopup} />}
            {dashboard.error && <div className="bg-destructive/20 text-destructive p-3 rounded-md mb-4">{dashboard.error}</div>}

            <DashboardMetrics 
                repositories={dashboard.repositories}
                selectedTemplate={dashboard.selectedTemplate}
                isAiThinking={dashboard.isAiThinking}
                onTemplateChange={dashboard.setSelectedTemplate}
                onGenerateTemplate={dashboard.generateTemplate}
            />
            
            <ActionButtons
                isLoadingRepos={dashboard.isLoadingRepos}
                isDeleteMode={dashboard.isDeleteMode}
                selectedReposCount={dashboard.selectedRepos.size}
                dateSortOrder={dashboard.dateSortOrder}
                onRefresh={dashboard.handleRefresh}
                onDateSort={dashboard.handleDateSort}
                onAddRepo={() => dashboard.openModal('add')}
                onJobTemplate={() => dashboard.openModal('jobTemplate')}
                onToggleDeleteMode={dashboard.toggleDeleteMode}
                onBulkDelete={dashboard.handleBulkDelete}
            />

            <RepositoryList
              repositories={dashboard.repositories.filter(repo => !repo.fork)}
              isLoadingRepos={dashboard.isLoadingRepos}
              isDeleteMode={dashboard.isDeleteMode}
              selectedRepos={dashboard.selectedRepos}
              onDragEnd={dashboard.onDragEnd}
              onToggleSelection={dashboard.toggleRepoSelection}
              onDeleteRepo={dashboard.handleDeleteRepo}
              onRenameRepo={(repo) => {
                  dashboard.setNewRepoNameForRename(repo.name);
                        dashboard.handleRenameRepo(repo);
              }}
            />

            {dashboard.hasChanges && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <Button onClick={() => dashboard.setHasChanges(false)} disabled={dashboard.isAiThinking} className="w-full">
                        {dashboard.isAiThinking ? 'Applying...' : <><CheckCircle className="w-4 h-4 mr-2" />Apply Changes</>}
                    </Button>
                </div>
            )}

            {forkedRepos.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Forked Repositories</h3>
                    {/* You can map over forkedRepos here to display them */}
                </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <ChatSidebar
              isMinimized={dashboard.isChatMinimized}
              isCriticMode={dashboard.isCriticMode}
              isInterviewMode={dashboard.isInterviewMode}
              interviewProgress={dashboard.interviewProgress}
              generatedReadme={dashboard.generatedReadme}
              chatMessages={dashboard.chatMessages}
              chatMessage={dashboard.chatMessage}
              isAiThinking={dashboard.isAiThinking}
              welcomeText={dashboard.welcomeText}
              isTypingWelcome={dashboard.isTypingWelcome}
              repositories={dashboard.repositories}
              chatEndRef={dashboard.chatEndRef}
              setIsMinimized={dashboard.setIsChatMinimized}
              setIsCriticMode={dashboard.setIsCriticMode}
              setChatMessage={dashboard.setChatMessage}
              handleSendMessage={dashboard.handleSendMessage}
              handleResetChat={dashboard.handleResetChat}
              downloadPortfolioReadme={dashboard.downloadPortfolioReadme}
              sendDirectMessage={dashboard.sendDirectMessage}
              generateReadme={dashboard.generateReadme}
            />
          </div>
        </div>
        
        <Modals
            showDeleteConfirm={dashboard.showDeleteConfirm}
            repoToDelete={dashboard.repoToDelete}
            isDeleting={dashboard.isDeleting}
            onConfirmDelete={dashboard.onConfirmDelete}
            onCancelDelete={() => dashboard.closeModal('delete')}
            showJobTemplateModal={dashboard.showJobTemplateModal}
            jobTitle={dashboard.jobTitle}
            isGeneratingTemplate={dashboard.isGeneratingTemplate}
            templateResults={dashboard.templateResults}
            onJobTitleChange={dashboard.setJobTitle}
            onGenerateJobTemplate={dashboard.generateJobTemplate}
            onCloseJobTemplate={() => dashboard.closeModal('jobTemplate')}
            showAddRepoModal={dashboard.showAddRepoModal}
            newRepoName={dashboard.newRepoName}
            newRepoDescription={dashboard.newRepoDescription}
            isCreatingRepo={dashboard.isCreatingRepo}
            onNewRepoNameChange={dashboard.setNewRepoName}
            onNewRepoDescriptionChange={dashboard.setNewRepoDescription}
            onCreateRepo={dashboard.onCreateRepo}
            onCloseAddRepo={() => dashboard.closeModal('add')}
            showRenameModal={dashboard.showRenameModal}
            repoToRename={dashboard.repoToRename}
            newRepoNameForRename={dashboard.newRepoNameForRename}
            isRenamingRepo={dashboard.isRenamingRepo}
            onNewRepoNameForRenameChange={dashboard.setNewRepoNameForRename}
            onRenameRepo={dashboard.onRenameRepo}
            onCloseRenameRepo={() => dashboard.closeModal('rename')}
        />
      </div>
    </div>
  );
}