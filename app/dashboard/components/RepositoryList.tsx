import React from 'react';
import { DragDropContext, Droppable, DroppableProvided } from "@hello-pangea/dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { GitHubRepo } from '../types';
import { RepoItem } from './RepoItem';

interface RepositoryListProps {
  repositories: GitHubRepo[];
  isLoadingRepos: boolean;
  isDeleteMode: boolean;
  selectedRepos: Set<number>;
  onDragEnd: (result: any) => void;
  onToggleSelection: (id: number) => void;
  onDeleteRepo: (repo: GitHubRepo) => void;
  onRenameRepo: (repo: GitHubRepo) => void;
}

export function RepositoryList({
  repositories,
  isLoadingRepos,
  isDeleteMode,
  selectedRepos,
  onDragEnd,
  onToggleSelection,
  onDeleteRepo,
  onRenameRepo
}: RepositoryListProps) {
  if (isLoadingRepos && repositories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading repositories...</span>
        </div>
      </div>
    );
  }

  if (repositories.length === 0) {
      return (
          <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No Repositories Found</h3>
              <p className="text-muted-foreground">Please check your GitHub token or refresh.</p>
          </div>
      )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <ScrollArea className="h-[calc(100vh-400px)]">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="repositories">
              {(provided: DroppableProvided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pr-4">
                  {repositories.map((repo, index) => (
                    <RepoItem
                      key={repo.id}
                      repo={repo}
                      index={index}
                      isDeleteMode={isDeleteMode}
                      isSelected={selectedRepos.has(repo.id)}
                      onToggleSelection={onToggleSelection}
                      onDelete={onDeleteRepo}
                      onRename={onRenameRepo}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}