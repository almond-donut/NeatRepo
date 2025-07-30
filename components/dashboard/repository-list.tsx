import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Folder } from 'lucide-react';
import { useRepositoryStore } from '@/stores';
import { useDragAndDrop } from '@/hooks/dashboard';
import { RepositoryCard } from './repository-card';
import { GitHubRepo } from '@/stores/types';

interface RepositoryListProps {
  onDeleteRepository?: (repo: GitHubRepo) => void;
  className?: string;
}

export const RepositoryList: React.FC<RepositoryListProps> = ({
  onDeleteRepository,
  className = ''
}) => {
  const { 
    repositories, 
    isLoadingRepos, 
    isPreviewMode,
    previewRepositories 
  } = useRepositoryStore();
  
  const { handleDragEnd } = useDragAndDrop();

  // Determine which repositories to display
  const displayedRepositories = isPreviewMode ? previewRepositories : repositories;

  // Loading state
  if (isLoadingRepos === 'loading') {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading repositories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isLoadingRepos === 'error') {
    return (
      <Alert className={`${className}`} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load repositories. Please try refreshing or check your connection.
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (displayedRepositories.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No repositories found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {repositories.length === 0 
            ? "It looks like you don't have any repositories yet, or they couldn't be loaded."
            : "No repositories match the current filter or sort criteria."
          }
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="repositories">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`transition-colors duration-200 ${
                snapshot.isDraggingOver ? 'bg-muted/50' : ''
              }`}
            >
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {displayedRepositories.map((repo, index) => (
                    <RepositoryCard
                      key={repo.id}
                      repository={repo}
                      index={index}
                      onDelete={onDeleteRepository}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              </ScrollArea>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Preview Mode Indicator */}
      {isPreviewMode && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Preview mode active - changes will not be saved until applied
          </p>
        </div>
      )}
    </div>
  );
};
