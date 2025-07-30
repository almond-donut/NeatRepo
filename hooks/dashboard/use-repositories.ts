import { useEffect, useCallback } from 'react';
import { useRepositoryStore, useErrorStore } from '@/stores';
import { repositoryManager } from '@/lib/repository-manager';
import { useAuth } from '@/components/auth-provider';

/**
 * Custom hook for managing repository data and operations
 */
export const useRepositories = () => {
  const { user, profile, getEffectiveToken } = useAuth();
  const { addCriticalError, addWarning } = useErrorStore();
  
  const {
    repositories,
    originalRepositories,
    isLoadingRepos,
    setRepositories,
    setOriginalRepositories,
    setLoadingState,
    resetRepositories
  } = useRepositoryStore();
  
  // Fetch repositories with proper error handling
  const fetchRepositories = useCallback(async (forceRefresh = false) => {
    if (!user) {
      addWarning('User authentication required to fetch repositories');
      return;
    }
    
    try {
      setLoadingState('loading');
      
      const effectiveToken = await getEffectiveToken();
      if (!effectiveToken) {
        addWarning('GitHub token not available. Some features may be limited.');
        setLoadingState('error');
        return;
      }
      
      await repositoryManager.fetchRepositories(
        effectiveToken, 
        forceRefresh, 
        user.id
      );
      
      // Repository manager uses singleton pattern - get repositories from there
      const currentRepos = repositoryManager.getRepositories();
      if (currentRepos && currentRepos.length > 0) {
        setRepositories(currentRepos);
        setOriginalRepositories(currentRepos);
        setLoadingState('success');
      } else {
        addWarning('No repositories found or empty response from GitHub API');
        setLoadingState('success');
      }
      
    } catch (error) {
      console.error('Error fetching repositories:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          addCriticalError('GitHub token is invalid or expired. Please reconnect your account.', 'AUTH_ERROR');
        } else if (error.message.includes('403')) {
          addCriticalError('GitHub API rate limit exceeded. Please try again later.', 'RATE_LIMIT');
        } else if (error.message.includes('404')) {
          addWarning('Some repositories may not be accessible with current permissions.', 'ACCESS_LIMITED');
        } else {
          addCriticalError(`Failed to fetch repositories: ${error.message}`, 'FETCH_ERROR');
        }
      } else {
        addCriticalError('An unexpected error occurred while fetching repositories', 'UNKNOWN_ERROR');
      }
      
      setLoadingState('error');
    }
  }, [user, getEffectiveToken, setRepositories, setOriginalRepositories, setLoadingState, addCriticalError, addWarning]);
  
  // Auto-fetch on mount and when user changes
  useEffect(() => {
    if (user && profile) {
      fetchRepositories();
    } else if (!user) {
      resetRepositories();
    }
  }, [user, profile, fetchRepositories, resetRepositories]);
  
  // Delete repository with proper error handling
  const deleteRepository = useCallback(async (repo: any) => {
    if (!user || !repo) {
      addWarning('Invalid repository or user context for deletion');
      return false;
    }
    
    try {
      setLoadingState('loading');
      
      const effectiveToken = await getEffectiveToken();
      if (!effectiveToken) {
        addCriticalError('GitHub token required for repository deletion');
        setLoadingState('error');
        return false;
      }
      
      // Call GitHub API to delete repository
      const response = await fetch(`/api/github/repos/${repo.full_name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${effectiveToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to delete repository: ${response.statusText}`);
      }
      
      // Remove from local state
      const updatedRepos = repositories.filter(r => r.id !== repo.id);
      setRepositories(updatedRepos);
      setOriginalRepositories(updatedRepos);
      
      setLoadingState('success');
      return true;
      
    } catch (error) {
      console.error('Error deleting repository:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          addCriticalError('You do not have permission to delete this repository', 'PERMISSION_DENIED');
        } else if (error.message.includes('404')) {
          addWarning('Repository not found or already deleted', 'NOT_FOUND');
        } else {
          addCriticalError(`Failed to delete repository: ${error.message}`, 'DELETE_ERROR');
        }
      } else {
        addCriticalError('An unexpected error occurred during deletion', 'UNKNOWN_DELETE_ERROR');
      }
      
      setLoadingState('error');
      return false;
    }
  }, [user, repositories, getEffectiveToken, setRepositories, setOriginalRepositories, setLoadingState, addCriticalError, addWarning]);
  
  return {
    repositories,
    originalRepositories,
    isLoadingRepos,
    fetchRepositories,
    deleteRepository,
    hasRepositories: repositories.length > 0,
    isError: isLoadingRepos === 'error',
    isLoading: isLoadingRepos === 'loading',
    isSuccess: isLoadingRepos === 'success'
  };
};
