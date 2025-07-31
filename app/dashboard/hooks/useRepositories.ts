// app/dashboard/hooks/useRepositories.ts
"use client"

import { useState, useEffect, useCallback } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/components/auth-provider";
import { repositoryManager } from "@/lib/repository-manager";
import { GitHubRepo } from "../types";

export function useRepositories(
  addChatMessage: (message: { role: 'assistant'; content: string }) => void,
  openModal: (modal: 'delete' | 'rename' | 'add') => void,
  setRepoToDelete: (repo: GitHubRepo | null) => void,
  setRepoToRename: (repo: GitHubRepo | null) => void
) {
  const { user, profile, loading: authLoading, getEffectiveToken, showTokenPopup } = useAuth();
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [originalRepositories, setOriginalRepositories] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Repo management state
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [isRenamingRepo, setIsRenamingRepo] = useState(false);
  const [dateSortOrder, setDateSortOrder] = useState<'newest' | 'oldest' | 'default'>('default');
  const [hasChanges, setHasChanges] = useState(false);

  // --- Core Repository Actions ---

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    const effectiveToken = await getEffectiveToken();
    if (effectiveToken) {
      setIsLoadingRepos(true);
      setError(null);
      try {
        // Force refresh from API
        await repositoryManager.fetchRepositories(effectiveToken, true, user.id);
      } catch (e: any) {
        setError(e.message || "Failed to refresh repositories.");
      } finally {
        setIsLoadingRepos(false);
      }
    } else {
      setError("GitHub token not found. Cannot refresh.");
    }
  }, [user, getEffectiveToken]);

  const createRepository = async (newRepoName: string, newRepoDescription: string) => {
    if (!newRepoName.trim()) return;
    const effectiveToken = await getEffectiveToken();
    if (!effectiveToken) {
      addChatMessage({ role: "assistant", content: "To create repositories, please set up your GitHub Personal Access Token." });
      showTokenPopup();
      return;
    }
    setIsCreatingRepo(true);
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${effectiveToken}`, 'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRepoName.trim(), description: newRepoDescription.trim() || undefined, private: false, auto_init: true,
        }),
      });
      if (response.ok) {
        const newRepo = await response.json();
        setRepositories(prev => [newRepo, ...prev]);
        addChatMessage({ role: "assistant", content: `🎉 Repository "${newRepo.name}" created successfully!` });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create repository');
      }
    } catch (error: any) {
      addChatMessage({ role: "assistant", content: `Failed to create repository: ${error.message}` });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const renameRepository = async (repoToRename: GitHubRepo, newRepoNameForRename: string) => {
    if (!repoToRename || !newRepoNameForRename.trim()) return;
    const effectiveToken = await getEffectiveToken();
    if (!effectiveToken) {
      addChatMessage({ role: "assistant", content: "To rename repositories, please set up your GitHub Personal Access Token." });
      showTokenPopup();
      return;
    }
    setIsRenamingRepo(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${repoToRename.full_name}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${effectiveToken}`, 'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newRepoNameForRename.trim() }),
      });
      if (response.ok) {
        const updatedRepo = await response.json();
        setRepositories(prev => prev.map(repo =>
          repo.id === repoToRename.id ? { ...repo, name: updatedRepo.name, full_name: updatedRepo.full_name } : repo
        ));
        addChatMessage({ role: "assistant", content: `🎉 Repository renamed to "${updatedRepo.name}" successfully!` });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to rename repository');
      }
    } catch (error: any) {
      addChatMessage({ role: "assistant", content: `Failed to rename repository: ${error.message}` });
    } finally {
      setIsRenamingRepo(false);
    }
  };

  const confirmDeleteRepo = async (repoToDelete: GitHubRepo) => {
      const effectiveToken = await getEffectiveToken();
      if (!effectiveToken) {
        addChatMessage({ role: "assistant", content: "To delete repositories, please set up a GitHub PAT with 'delete_repo' permissions."});
        showTokenPopup();
        return;
      }
      setIsDeleting(true);
      try {
        const response = await fetch(`https://api.github.com/repos/${repoToDelete.full_name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `token ${effectiveToken}`, 'Accept': 'application/vnd.github.v3+json' },
        });
        if (response.status === 204) {
          setRepositories(prev => prev.filter(repo => repo.id !== repoToDelete.id));
          addChatMessage({ role: "assistant", content: `🗑️ Repository "${repoToDelete.name}" has been permanently deleted.` });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to delete repository. Status: ${response.status}`);
        }
      } catch (error: any) {
        addChatMessage({ role: "assistant", content: `❌ Failed to delete repository: ${error.message}` });
      } finally {
        setIsDeleting(false);
      }
  };

  const handleBulkDelete = async () => {
    const effectiveToken = await getEffectiveToken();
    if (!effectiveToken) {
      addChatMessage({ role: "assistant", content: `Bulk delete requires a GitHub PAT with 'delete_repo' permissions.` });
      showTokenPopup();
      return;
    }
    const reposToDelete = repositories.filter(repo => selectedRepos.has(repo.id));
    if (reposToDelete.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${reposToDelete.length} repositories? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    let deletedCount = 0;
    for (const repo of reposToDelete) {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo.full_name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `token ${effectiveToken}`, 'Accept': 'application/vnd.github.v3+json' },
        });
        if (response.status === 204) deletedCount++;
        else console.error(`Failed to delete ${repo.name}: ${response.statusText}`);
      } catch (error) {
        console.error(`Error deleting ${repo.name}:`, error);
      }
    }
    await handleRefresh();
    addChatMessage({ role: "assistant", content: `🗑️ Bulk delete complete. Deleted ${deletedCount} of ${reposToDelete.length} repositories.` });
    setIsDeleting(false);
    setIsDeleteMode(false);
    setSelectedRepos(new Set());
  };

  // --- UI State and Interaction Handlers ---

  const handleDeleteRepo = (repo: GitHubRepo) => {
    setRepoToDelete(repo);
    openModal('delete');
  };
  
  const handleRenameRepo = (repo: GitHubRepo) => {
    setRepoToRename(repo);
    openModal('rename');
  };

  const toggleRepoSelection = (repoId: number) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev);
      newSet.has(repoId) ? newSet.delete(repoId) : newSet.add(repoId);
      return newSet;
    });
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => !prev);
    setSelectedRepos(new Set());
  };

  const sortRepositoriesByDate = (repos: GitHubRepo[], order: 'newest' | 'oldest' | 'default'): GitHubRepo[] => {
    if (order === 'default') return [...originalRepositories];
    return [...repos].sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleDateSort = (order: 'newest' | 'oldest' | 'default') => {
    setDateSortOrder(order);
    setRepositories(prev => sortRepositoriesByDate(prev, order));
    setHasChanges(order !== 'default');
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const newRepos = Array.from(repositories);
    const [reorderedItem] = newRepos.splice(source.index, 1);
    newRepos.splice(destination.index, 0, reorderedItem);

    setRepositories(newRepos);
    setHasChanges(true);
  };
  
  // --- Data Fetching and Initialization ---

  useEffect(() => {
    const unsubscribe = repositoryManager.subscribe((repos) => {
      setRepositories(repos);
      if (originalRepositories.length === 0) setOriginalRepositories(repos);
      setIsLoadingRepos(false);
    });
    return () => unsubscribe();
  }, [originalRepositories.length]);

  const fetchInitialData = useCallback(async () => {
    if (!user || isInitialized) return;
    const effectiveToken = await getEffectiveToken();
    if (effectiveToken) {
      setIsLoadingRepos(true);
      try {
        await repositoryManager.fetchRepositories(effectiveToken, false, user.id);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to load repositories.");
      } finally {
        setIsLoadingRepos(false);
        setIsInitialized(true);
      }
    } else if (!authLoading) {
      setError("GitHub token not found.");
      setIsLoadingRepos(false);
      setIsInitialized(true);
    }
  }, [user, isInitialized, getEffectiveToken, authLoading]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    repositories,
    isLoadingRepos,
    error,
    handleRefresh,
    // Deletion
    isDeleteMode,
    isDeleting,
    selectedRepos,
    toggleDeleteMode,
    toggleRepoSelection,
    handleDeleteRepo,
    confirmDeleteRepo,
    handleBulkDelete,
    // Sorting & Ordering
    dateSortOrder,
    handleDateSort,
    onDragEnd,
    hasChanges,
    setHasChanges,
    // Creation & Renaming
    isCreatingRepo,
    isRenamingRepo,
    createRepository,
    renameRepository,
    handleRenameRepo,
    // Other
    setRepositories
  };
}