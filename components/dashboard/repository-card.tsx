import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  GitFork, 
  Clock, 
  ExternalLink, 
  GripVertical,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useRepositoryStore } from '@/stores';
import { GitHubRepo } from '@/stores/types';

interface RepositoryCardProps {
  repository: GitHubRepo;
  index: number;
  onDelete?: (repo: GitHubRepo) => void;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repository,
  index,
  onDelete
}) => {
  const { 
    expandedRepos, 
    selectedRepos, 
    isDeleteMode,
    toggleRepoExpansion,
    toggleRepoSelection
  } = useRepositoryStore();

  const isExpanded = expandedRepos.has(repository.id);
  const isSelected = selectedRepos.has(repository.id);

  const handleToggleExpansion = () => {
    toggleRepoExpansion(repository.id);
  };

  const handleToggleSelection = () => {
    if (isDeleteMode) {
      toggleRepoSelection(repository.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(repository);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Draggable draggableId={repository.id.toString()} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-3 transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
          } ${
            isSelected ? 'ring-2 ring-destructive' : ''
          } ${
            isDeleteMode ? 'cursor-pointer' : ''
          }`}
          onClick={isDeleteMode ? handleToggleSelection : undefined}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div
                {...provided.dragHandleProps}
                className="mt-1 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {repository.name}
                      </h3>
                      {repository.private && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                      {repository.fork && (
                        <Badge variant="outline" className="text-xs">
                          Fork
                        </Badge>
                      )}
                    </div>

                    {repository.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {repository.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {repository.language && (
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full bg-yellow-500"
                            title={repository.language}
                          />
                          <span>{repository.language}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>{repository.stargazers_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="h-3 w-3" />
                        <span>{repository.forks_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(repository.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isDeleteMode ? (
                      <Button
                        size="sm"
                        variant={isSelected ? "destructive" : "outline"}
                        onClick={handleDelete}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleToggleExpansion}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <a 
                            href={repository.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Extended Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Full Name:</span>
                        <br />
                        <span className="text-muted-foreground">{repository.full_name}</span>
                      </div>
                      <div>
                        <span className="font-medium">Last Push:</span>
                        <br />
                        <span className="text-muted-foreground">{formatDate(repository.updated_at)}</span>
                      </div>
                    </div>

                    {repository.fork && repository.parent && (
                      <div className="text-xs">
                        <span className="font-medium">Forked from:</span>
                        <br />
                        <a 
                          href={repository.parent.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-600 hover:underline dark:text-yellow-400"
                        >
                          {repository.parent.full_name}
                        </a>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a 
                          href={repository.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View on GitHub
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};
