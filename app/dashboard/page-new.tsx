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
                <ErrorDisplay 
                  error={isError} 
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
                onDelete={handleDeleteRepository}
                hasRepositories={hasRepositories}
              />
            </div>

            {/* AI Chat Panel */}
            <div className="lg:col-span-1">
              <AIChatPanel
                repositories={repositories}
                className="sticky top-6"
              />
            </div>
          </div>
        </div>

        {/* Job Template Modal */}
        <JobTemplateModal repositories={repositories} />
      </div>
    </AuthGuard>
  );
}
