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

  // Destructure with the correct properties
  const { 
    repositories, 
    profile, 
    handleRefresh // <-- Use the new handler
  } = dashboard;
  const forkedRepos = repositories.filter(repo => repo.fork);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {!profile?.github_pat_token && <GitHubTokenWarning onSetupToken={dashboard.showTokenPopup} />}
            {dashboard.error && <div className="bg-destructive/20 text-destructive p-3 rounded-md mb-4">{dashboard.error}</div>}

            <DashboardMetrics 
                repositories={repositories}
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
                onRefresh={handleRefresh}
                onDateSort={dashboard.handleDateSort}
                onAddRepo={() => dashboard.setShowAddRepoModal(true)}
                onJobTemplate={() => dashboard.setShowJobTemplateModal(true)}
                onToggleDeleteMode={dashboard.toggleDeleteMode}
                onBulkDelete={dashboard.handleBulkDelete}
            />

            <RepositoryList
              repositories={repositories.filter(repo => !repo.fork)}
              isLoadingRepos={dashboard.isLoadingRepos}
              isDeleteMode={dashboard.isDeleteMode}
              selectedRepos={dashboard.selectedRepos}
              onDragEnd={dashboard.onDragEnd}
              onToggleSelection={dashboard.toggleRepoSelection}
              onDeleteRepo={dashboard.handleDeleteRepo}
              onRenameRepo={(repo) => {
                  dashboard.setRepoToRename(repo);
                  dashboard.setNewRepoNameForRename(repo.name);
                  dashboard.setShowRenameModal(true);
              }}
            />

            {dashboard.hasChanges && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <Button onClick={dashboard.applyChanges} disabled={dashboard.isAiThinking} className="w-full">
                        {dashboard.isAiThinking ? 'Applying...' : <><CheckCircle className="w-4 h-4 mr-2" />Apply Changes</>}
                    </Button>
                </div>
            )}

            {/* You can extract Forked Repos into its own component too if you like */}
            {forkedRepos.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Forked Repositories</h3>
                    {/* JSX for forked repos list goes here */}
                </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <ChatSidebar
              isMinimized={dashboard.isChatMinimized}
              chatMessages={dashboard.chatMessages}
              chatMessage={dashboard.chatMessage}
              isAiThinking={dashboard.isAiThinking}
              chatEndRef={dashboard.chatEndRef}
              setIsMinimized={dashboard.setIsChatMinimized}
              setChatMessage={dashboard.setChatMessage}
              handleSendMessage={dashboard.handleSendMessage}
              handleResetChat={dashboard.handleResetChat}
            />
          </div>
        </div>
        <Modals
            showDeleteConfirm={dashboard.showDeleteConfirm}
            repoToDelete={dashboard.repoToDelete}
            isDeleting={dashboard.isDeleting}
            onConfirmDelete={dashboard.confirmDeleteRepo}
            onCancelDelete={() => dashboard.setShowDeleteConfirm(false)}
            showJobTemplateModal={dashboard.showJobTemplateModal}
            jobTitle={dashboard.jobTitle}
            isGeneratingTemplate={dashboard.isGeneratingTemplate}
            templateResults={dashboard.templateResults}
            onJobTitleChange={dashboard.setJobTitle}
            onGenerateJobTemplate={dashboard.generateJobTemplate}
            onCloseJobTemplate={() => {
                dashboard.setShowJobTemplateModal(false);
                dashboard.setTemplateResults([]);
            }}
            showAddRepoModal={dashboard.showAddRepoModal}
            newRepoName={dashboard.newRepoName}
            newRepoDescription={dashboard.newRepoDescription}
            isCreatingRepo={dashboard.isCreatingRepo}
            onNewRepoNameChange={dashboard.setNewRepoName}
            onNewRepoDescriptionChange={dashboard.setNewRepoDescription}
            onCreateRepo={dashboard.createRepository}
            onCloseAddRepo={() => dashboard.setShowAddRepoModal(false)}
            showRenameModal={dashboard.showRenameModal}
            repoToRename={dashboard.repoToRename}
            newRepoNameForRename={dashboard.newRepoNameForRename}
            isRenamingRepo={dashboard.isRenamingRepo}
            onNewRepoNameForRenameChange={dashboard.setNewRepoNameForRename}
            onRenameRepo={dashboard.renameRepository}
            onCloseRenameRepo={() => dashboard.setShowRenameModal(false)}
        />
      </div>
    </div>
  );
}