import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GitHubRepo, LoadingState, AppError } from './types';

interface RepositoryState {
  // Repository data
  repositories: GitHubRepo[];
  originalRepositories: GitHubRepo[];
  previewRepositories: GitHubRepo[];
  
  // Loading states
  isLoadingRepos: LoadingState;
  
  // UI state
  isPreviewMode: boolean;
  expandedRepos: Set<number>;
  selectedRepos: Set<number>;
  isDeleteMode: boolean;
  
  // Sorting and filtering
  dateSortOrder: 'newest' | 'oldest' | 'default';
  
  // Modal states
  showDeleteConfirm: boolean;
  repoToDelete: GitHubRepo | null;
  isDeleting: boolean;
  
  // Actions
  setRepositories: (repos: GitHubRepo[]) => void;
  setOriginalRepositories: (repos: GitHubRepo[]) => void;
  setPreviewRepositories: (repos: GitHubRepo[]) => void;
  setLoadingState: (state: LoadingState) => void;
  setPreviewMode: (mode: boolean) => void;
  toggleRepoExpansion: (repoId: number) => void;
  toggleRepoSelection: (repoId: number) => void;
  clearSelectedRepos: () => void;
  setDeleteMode: (mode: boolean) => void;
  setSortOrder: (order: 'newest' | 'oldest' | 'default') => void;
  setDeleteConfirm: (show: boolean, repo?: GitHubRepo | null) => void;
  setDeleting: (deleting: boolean) => void;
  
  // Complex actions
  applyPreview: () => void;
  cancelPreview: () => void;
  resetRepositories: () => void;
}

export const useRepositoryStore = create<RepositoryState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    repositories: [],
    originalRepositories: [],
    previewRepositories: [],
    isLoadingRepos: 'idle',
    isPreviewMode: false,
    expandedRepos: new Set(),
    selectedRepos: new Set(),
    isDeleteMode: false,
    dateSortOrder: 'default',
    showDeleteConfirm: false,
    repoToDelete: null,
    isDeleting: false,
    
    // Basic setters
    setRepositories: (repos) => set({ repositories: repos }),
    setOriginalRepositories: (repos) => set({ originalRepositories: repos }),
    setPreviewRepositories: (repos) => set({ previewRepositories: repos }),
    setLoadingState: (state) => set({ isLoadingRepos: state }),
    setPreviewMode: (mode) => set({ isPreviewMode: mode }),
    setDeleteMode: (mode) => set({ isDeleteMode: mode }),
    setSortOrder: (order) => set({ dateSortOrder: order }),
    setDeleting: (deleting) => set({ isDeleting: deleting }),
    
    // Set operations
    toggleRepoExpansion: (repoId) => set((state) => {
      const newExpanded = new Set(state.expandedRepos);
      if (newExpanded.has(repoId)) {
        newExpanded.delete(repoId);
      } else {
        newExpanded.add(repoId);
      }
      return { expandedRepos: newExpanded };
    }),
    
    toggleRepoSelection: (repoId) => set((state) => {
      const newSelected = new Set(state.selectedRepos);
      if (newSelected.has(repoId)) {
        newSelected.delete(repoId);
      } else {
        newSelected.add(repoId);
      }
      return { selectedRepos: newSelected };
    }),
    
    clearSelectedRepos: () => set({ selectedRepos: new Set() }),
    
    // Delete modal
    setDeleteConfirm: (show, repo) => set({ 
      showDeleteConfirm: show, 
      repoToDelete: repo || null 
    }),
    
    // Complex operations
    applyPreview: () => set((state) => ({
      repositories: [...state.previewRepositories],
      originalRepositories: [...state.previewRepositories],
      isPreviewMode: false,
      previewRepositories: []
    })),
    
    cancelPreview: () => set((state) => ({
      repositories: [...state.originalRepositories],
      isPreviewMode: false,
      previewRepositories: []
    })),
    
    resetRepositories: () => set({
      repositories: [],
      originalRepositories: [],
      previewRepositories: [],
      expandedRepos: new Set(),
      selectedRepos: new Set(),
      isPreviewMode: false,
      isDeleteMode: false,
      dateSortOrder: 'default'
    })
  }))
);
