import { useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useRepositoryStore, useErrorStore } from '@/stores';
import { RepositorySorter } from '@/lib/repository-sorter';

/**
 * Custom hook for handling drag and drop functionality
 */
export const useDragAndDrop = () => {
  const { 
    repositories, 
    setRepositories, 
    setPreviewRepositories, 
    setPreviewMode 
  } = useRepositoryStore();
  const { addWarning } = useErrorStore();

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source } = result;

    // If no destination, do nothing
    if (!destination) {
      return;
    }

    // If dropped in same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      // Create a copy of repositories for reordering
      const reorderedRepos = Array.from(repositories);
      const [reorderedItem] = reorderedRepos.splice(source.index, 1);
      reorderedRepos.splice(destination.index, 0, reorderedItem);

      // Update repositories and show as preview
      setPreviewRepositories(reorderedRepos);
      setPreviewMode(true);

    } catch (error) {
      console.error('Error during drag and drop:', error);
      addWarning('Failed to reorder repositories. Please try again.');
    }
  }, [repositories, setRepositories, setPreviewRepositories, setPreviewMode, addWarning]);

  return {
    handleDragEnd
  };
};

/**
 * Custom hook for sorting functionality
 */
export const useRepositorySorting = () => {
  const { 
    repositories,
    dateSortOrder,
    setRepositories,
    setPreviewRepositories,
    setSortOrder,
    setPreviewMode
  } = useRepositoryStore();
  const { addInfo, addWarning } = useErrorStore();

  const applySorting = useCallback(async (
    sortType: 'stars' | 'forks' | 'updated' | 'name' | 'size' | 'complexity',
    order: 'newest' | 'oldest' | 'default' = 'default'
  ) => {
    if (repositories.length === 0) {
      addWarning('No repositories available to sort');
      return;
    }

    try {
      let sortedRepos = [...repositories];

      switch (sortType) {
        case 'stars':
          sortedRepos.sort((a, b) => {
            const compareValue = b.stargazers_count - a.stargazers_count;
            return order === 'oldest' ? -compareValue : compareValue;
          });
          addInfo(`Repositories sorted by stars (${order})`);
          break;
        case 'forks':
          sortedRepos.sort((a, b) => {
            const compareValue = b.forks_count - a.forks_count;
            return order === 'oldest' ? -compareValue : compareValue;
          });
          addInfo(`Repositories sorted by forks (${order})`);
          break;
        case 'updated':
          sortedRepos.sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime();
            const dateB = new Date(b.updated_at).getTime();
            const compareValue = dateB - dateA;
            return order === 'oldest' ? -compareValue : compareValue;
          });
          addInfo(`Repositories sorted by last updated (${order})`);
          break;
        case 'name':
          sortedRepos.sort((a, b) => {
            const compareValue = a.name.localeCompare(b.name);
            return order === 'oldest' ? -compareValue : compareValue;
          });
          addInfo(`Repositories sorted by name (${order})`);
          break;
        case 'complexity':
          // For now, sort by a complexity-like metric (stars + forks + recent activity)
          sortedRepos.sort((a, b) => {
            const scoreA = a.stargazers_count + a.forks_count + (Date.now() - new Date(a.updated_at).getTime() > 30 * 24 * 60 * 60 * 1000 ? 0 : 1);
            const scoreB = b.stargazers_count + b.forks_count + (Date.now() - new Date(b.updated_at).getTime() > 30 * 24 * 60 * 60 * 1000 ? 0 : 1);
            const compareValue = scoreB - scoreA;
            return order === 'oldest' ? -compareValue : compareValue;
          });
          addInfo(`Repositories sorted by complexity (${order})`);
          break;
        default:
          addWarning('Unknown sort type');
          return;
      }

      if (sortedRepos) {
        setPreviewRepositories(sortedRepos);
        setPreviewMode(true);
        setSortOrder(order);
      }

    } catch (error) {
      console.error('Error sorting repositories:', error);
      addWarning(`Failed to sort repositories by ${sortType}. Please try again.`);
    }
  }, [repositories, setPreviewRepositories, setPreviewMode, setSortOrder, addInfo, addWarning]);

  const resetSorting = useCallback(() => {
    setSortOrder('default');
    setPreviewMode(false);
    addInfo('Repository sorting reset to default order');
  }, [setSortOrder, setPreviewMode, addInfo]);

  return {
    applySorting,
    resetSorting,
    currentSortOrder: dateSortOrder
  };
};
