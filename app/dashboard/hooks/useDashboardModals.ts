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

  // Job Template Modal State
  const [showJobTemplateModal, setShowJobTemplateModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [templateResults, setTemplateResults] = useState<GitHubRepo[]>([]);
  
  const openModal = (modal: 'delete' | 'rename' | 'add' | 'jobTemplate') => {
    if (modal === 'delete') setShowDeleteConfirm(true);
    if (modal === 'rename') setShowRenameModal(true);
    if (modal === 'add') setShowAddRepoModal(true);
    if (modal === 'jobTemplate') setShowJobTemplateModal(true);
  };

  const closeModal = (modal: 'delete' | 'rename' | 'add' | 'jobTemplate') => {
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
    if (modal === 'jobTemplate') {
        setShowJobTemplateModal(false);
        setJobTitle('');
        setTemplateResults([]);
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
    // Job Template Modal
    showJobTemplateModal,
    jobTitle,
    setJobTitle,
    isGeneratingTemplate,
    setIsGeneratingTemplate,
    templateResults,
    setTemplateResults,
    // Control functions
    openModal,
    closeModal,
  };
}