import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  ArrowUp, 
  Target, 
  Calendar,
  CalendarDays,
  Download,
  Zap,
  CheckCircle,
  X
} from 'lucide-react';
import { useRepositoryStore, useUIStore } from '@/stores';
import { useRepositorySorting } from '@/hooks/dashboard';

interface RepositoryActionsProps {
  onRefresh: () => void;
  onJobTemplateOpen: () => void;
  isLoading: boolean;
  repositoryCount: number;
}

export const RepositoryActions: React.FC<RepositoryActionsProps> = ({
  onRefresh,
  onJobTemplateOpen,
  isLoading,
  repositoryCount
}) => {
  const { isPreviewMode, applyPreview, cancelPreview } = useRepositoryStore();
  const { applySorting, resetSorting, currentSortOrder } = useRepositorySorting();

  const handleSortByStars = () => applySorting('stars', 'newest');
  const handleSortByForks = () => applySorting('forks', 'newest');
  const handleSortByUpdated = () => applySorting('updated', 'newest');
  const handleSortByName = () => applySorting('name', 'default');
  const handleSortByComplexity = () => applySorting('complexity', 'newest');

  return (
    <div className="space-y-4">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Preview Mode Active
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={applyPreview}
                className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelPreview}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-950/30"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={onRefresh} 
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <Button 
          onClick={onJobTemplateOpen}
          size="sm"
          variant="outline"
        >
          <Target className="h-4 w-4 mr-2" />
          Job Template
        </Button>

        {repositoryCount > 0 && (
          <>
            <Button 
              onClick={handleSortByStars}
              size="sm"
              variant="outline"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Stars
            </Button>

            <Button 
              onClick={handleSortByForks}
              size="sm"
              variant="outline"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Forks
            </Button>

            <Button 
              onClick={handleSortByUpdated}
              size="sm"
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Updated
            </Button>

            <Button 
              onClick={handleSortByName}
              size="sm"
              variant="outline"
            >
              Name
            </Button>

            <Button 
              onClick={handleSortByComplexity}
              size="sm"
              variant="outline"
            >
              <Zap className="h-4 w-4 mr-2" />
              Complexity
            </Button>

            {currentSortOrder !== 'default' && (
              <Button 
                onClick={resetSorting}
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
              >
                Reset Sort
              </Button>
            )}
          </>
        )}
      </div>

      {/* Repository Count Badge */}
      {repositoryCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {repositoryCount} repositories
          </Badge>
          {currentSortOrder !== 'default' && (
            <Badge variant="outline" className="text-xs">
              Sorted: {currentSortOrder}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
