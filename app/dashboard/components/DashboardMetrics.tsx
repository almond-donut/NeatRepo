import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Star } from "lucide-react";
import { GitHubRepo } from '../types';


interface DashboardMetricsProps {
  repositories: GitHubRepo[];
}

export function DashboardMetrics({ repositories }: DashboardMetricsProps) {
  const publicRepos = repositories.filter((repo) => !repo.private).length;
  const privateRepos = repositories.length - publicRepos;
  const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repositories.length}</div>
            <p className="text-xs text-muted-foreground">{publicRepos} public, {privateRepos} private</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stars</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStars}</div>
            <p className="text-xs text-muted-foreground">Across all repositories</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}