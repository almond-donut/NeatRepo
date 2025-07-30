"use client"

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useRepositories } from "@/hooks/dashboard";
import { useUIStore } from "@/stores";
import { useAuth } from "@/components/auth-provider";

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic';

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

  // Auto-fetch repositories when component mounts
  useEffect(() => {
    if (user) {
      fetchRepositories();
    }
  }, [user, fetchRepositories]);

  const handleRefresh = () => {
    fetchRepositories(true); // Force refresh
  };

  const handleJobTemplateOpen = () => {
    setJobTemplateModal(true);
  };

  const handleDeleteRepository = async (repo: any) => {
    const success = await deleteRepository(repo);
    if (success) {
      // Repository was successfully deleted
      console.log(`Repository ${repo.name} deleted successfully`);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <DashboardHeader />
        
        {/* GitHub Token Warning */}
        <GitHubTokenWarning onSetupToken={showTokenPopup} />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Global Error Display */}
          <ErrorDisplay className="mb-6" />

          {/* Page Title and Description */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Repository Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage, organize, and optimize your GitHub repositories for maximum impact.
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Repository Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Repository Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Repository Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <RepositoryActions
                    onRefresh={handleRefresh}
                    onJobTemplateOpen={handleJobTemplateOpen}
                    isLoading={isLoading}
                    repositoryCount={repositories.length}
                  />
                </CardContent>
              </Card>

              {/* Repository List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Your Repositories
                    {hasRepositories && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({repositories.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RepositoryList onDeleteRepository={handleDeleteRepository} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              {hasRepositories && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Repositories</span>
                        <span className="font-medium">{repositories.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Stars</span>
                        <span className="font-medium">
                          {repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Forks</span>
                        <span className="font-medium">
                          {repositories.reduce((sum, repo) => sum + repo.forks_count, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Languages</span>
                        <span className="font-medium">
                          {new Set(repositories.filter(r => r.language).map(r => r.language)).size}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Getting Started */}
              {!hasRepositories && !isLoading && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <p>Welcome to your repository dashboard!</p>
                      <div className="space-y-2">
                        <p className="font-medium">To get started:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>1. Make sure your GitHub token is configured</li>
                          <li>2. Create some repositories on GitHub</li>
                          <li>3. Refresh to load your repositories</li>
                          <li>4. Use AI assistance to optimize your profile</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>

        {/* AI Chat Panel */}
        <AIChatPanel repositories={repositories} />

        {/* Job Template Modal */}
        <JobTemplateModal repositories={repositories} />
      </div>
    </AuthGuard>
  );
}
