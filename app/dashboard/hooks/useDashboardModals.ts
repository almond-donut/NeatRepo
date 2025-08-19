// app/dashboard/hooks/useDashboardModals.ts
"use client"

import { useState } from "react";
import { GitHubRepo } from "../types";

export function useDashboardModals() {
  // Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<GitHubRepo | null>(null);

  // Add Repo Modal State
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");

  // Rename Repo Modal State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [repoToRename, setRepoToRename] = useState<GitHubRepo | null>(null);
  const [newRepoNameForRename, setNewRepoNameForRename] = useState("");
  
  // ✨ NEW: State for Bulk Delete Confirmation Modal ✨
  // This state will control the visibility of our new confirmation dialog.
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  const openModal = (modal: 'delete' | 'rename' | 'add' | 'bulkDelete') => {
    if (modal === 'delete') setShowDeleteConfirm(true);
    if (modal === 'rename') setShowRenameModal(true);
    if (modal === 'add') setShowAddRepoModal(true);
    //
    // ✨ NEW: Show the bulk delete confirmation modal.
    if (modal === 'bulkDelete') setShowBulkDeleteConfirm(true);
  };

  const closeModal = (modal: 'delete' | 'rename' | 'add' | 'bulkDelete') => {
    if (modal === 'delete') {
      setShowDeleteConfirm(false);
      setRepoToDelete(null);
    }
    if (modal === 'rename') {
      setShowRenameModal(false);
      setRepoToRename(null);
      setNewRepoNameForRename("");
    }
    if (modal === 'add') {
      setShowAddRepoModal(false);
      setNewRepoName("");
      setNewRepoDescription("");
    }
    //
    // ✨ NEW: Hide the bulk delete confirmation modal.
    if (modal === 'bulkDelete') {
        setShowBulkDeleteConfirm(false);
    }
  };

  return {
    // Delete Modal
    showDeleteConfirm,
    repoToDelete,
    setRepoToDelete,
    // Add Repo Modal
    showAddRepoModal,
    newRepoName,
    setNewRepoName,
    newRepoDescription,
    setNewRepoDescription,
    // Rename Repo Modal
    showRenameModal,
    repoToRename,
    setRepoToRename,
    newRepoNameForRename,
    setNewRepoNameForRename,
    //
    // ✨ NEW: Expose bulk delete state and control functions.
    showBulkDeleteConfirm,
    // Control functions
    openModal,
    closeModal,
  };
}