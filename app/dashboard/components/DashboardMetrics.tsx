import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Folder, Star } from "lucide-react";
import { GitHubRepo } from '../types';


// Add ProjectTemplate interface
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: string[];
}

interface DashboardMetricsProps {
  repositories: GitHubRepo[];
  selectedTemplate: string;
  isAiThinking: boolean;
  onTemplateChange: (templateId: string) => void;
  onGenerateTemplate: (templateId: string) => void;
}

const projectTemplates: ProjectTemplate[] = [
  {
    id: "react-app",
    name: "React Web App",
    description: "Modern React application with TypeScript",
    icon: "⚛️",
    files: [
      "src/App.tsx",
      "src/components/Header.tsx",
      "src/components/Footer.tsx",
      "src/hooks/useAuth.ts",
      "src/utils/api.ts",
      "public/index.html",
      "package.json",
      "tsconfig.json",
      "tailwind.config.js"
    ]
  },
  // ... add more templates as needed
];

export function DashboardMetrics({ repositories, selectedTemplate, isAiThinking, onTemplateChange, onGenerateTemplate }: DashboardMetricsProps) {
  const publicRepos = repositories.filter((repo) => !repo.private).length;
  const privateRepos = repositories.length - publicRepos;
  const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Plus /> Quick Start Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedTemplate} onValueChange={onTemplateChange}>
                <SelectTrigger><SelectValue placeholder="Choose a project template..." /></SelectTrigger>
                <SelectContent>
                  {projectTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center space-x-2">
                        <span>{template.icon}</span>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => onGenerateTemplate(selectedTemplate)} disabled={!selectedTemplate || isAiThinking}>
              <Plus className="h-4 w-4 mr-2" /> Generate Template
            </Button>
          </div>
        </CardContent>
      </Card>
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