// app/dashboard/hooks/useDashboard.ts
"use client"

import { useAuth } from "@/components/auth-provider";
import { useRepositories } from "./useRepositories";
import { useDashboardModals } from "./useDashboardModals";

export function useDashboard() {
  const { user, profile, loading, signOut, showTokenPopup } = useAuth();
  


  // --- Instantiate Child Hooks ---

  // Modals hook must be initialized first to provide control functions
  const modals = useDashboardModals();

  // Repositories hook manages all repo data and actions
  const repos = useRepositories(
    modals.openModal,             // Pass modal-opening function
    modals.setRepoToDelete,       // Pass state setter
    modals.setRepoToRename        // Pass state setter
  );

  
  // --- Combine and Expose State and Functions ---

  return {
    // Auth context data
    user,
    profile,
    loading,
    signOut,
    showTokenPopup,

    // From useRepositories
    ...repos,

    // From useDashboardModals
    ...modals,
    
    // Functions to connect repository actions with modals
    onConfirmDelete: () => repos.confirmDeleteRepo(modals.repoToDelete!),
    onCreateRepo: () => {
        repos.createRepository(modals.newRepoName, modals.newRepoDescription)
        .then(() => modals.closeModal('add'));
    },
    onRenameRepo: () => {
        repos.renameRepository(modals.repoToRename!, modals.newRepoNameForRename)
        .then(() => modals.closeModal('rename'));
    },
    // ✨ NEW: Function to handle bulk delete confirmation
    onConfirmBulkDelete: () => {
        repos.handleBulkDelete()
        .then(() => modals.closeModal('bulkDelete'));
    }
  };
}