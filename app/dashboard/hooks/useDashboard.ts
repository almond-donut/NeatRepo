"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/components/auth-provider";
import { repositoryManager } from "@/lib/repository-manager";
import { aiAssistant } from "@/lib/ai-assistant";
import { geminiAI } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { GitHubRepo, ChatMessage } from "../types";

export function useDashboard() {
  const { user, profile, loading, signOut, showTokenPopup, getEffectiveToken } = useAuth();
  const router = useRouter();

  // State Management
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [originalRepositories, setOriginalRepositories] = useState<GitHubRepo[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<GitHubRepo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dateSortOrder, setDateSortOrder] = useState<'newest' | 'oldest' | 'default'>('default');
  const [showJobTemplateModal, setShowJobTemplateModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [templateResults, setTemplateResults] = useState<GitHubRepo[]>([]);
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [repoToRename, setRepoToRename] = useState<GitHubRepo | null>(null);
  const [newRepoNameForRename, setNewRepoNameForRename] = useState("");
  const [isRenamingRepo, setIsRenamingRepo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isCriticMode, setIsCriticMode] = useState(false);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Helper Functions ---

  // --- NEW REFRESH HANDLER ---
  const handleRefresh = async () => {
    if (!user) return;
    const effectiveToken = await getEffectiveToken();
    if (effectiveToken) {
      setIsLoadingRepos(true);
      setError(null);
      try {
        await repositoryManager.fetchRepositories(effectiveToken, true, user.id);
      } catch (e: any) {
        setError(e.message || "Failed to refresh repositories.");
      } finally {
        setIsLoadingRepos(false);
      }
    } else {
      setError("GitHub token not found. Cannot refresh.");
    }
  };
  const addChatMessage = (message: Omit<ChatMessage, 'timestamp'>) => {
    setChatMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
  };

  const saveAndDownloadContent = async (content: string, filename: string, contentType: string = 'text/markdown') => {
    // ... (copy the entire saveAndDownloadContent function from the original page.tsx here)
  };
  
  // --- Logic Functions ---

  const createRepository = async () => {
    if (!newRepoName.trim()) return;
    if (!profile?.github_pat_token) {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `To create repositories, please set up your GitHub Personal Access Token first. Click the 'Setup GitHub Token' button above.`,
      });
      showTokenPopup(); // Automatically show the token setup popup
      return;
    }

    setIsCreatingRepo(true);
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${profile.github_pat_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDescription.trim() || undefined,
          private: false,
          auto_init: true,
        }),
      });

      if (response.ok) {
        const newRepo = await response.json();
        setRepositories(prev => [newRepo, ...prev]);
        setNewRepoName("");
        setNewRepoDescription("");
        setShowAddRepoModal(false);
        addChatMessage({
          id: Date.now().toString(),
          role: "assistant",
          content: `🎉 Repository "${newRepo.name}" created successfully!`,
        });
      } else {
        throw new Error('Failed to create repository');
      }
    } catch (error) {
      console.error('Error creating repository:', error);
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `Failed to create repository. Please check your GitHub token permissions and try again.`,
      });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const renameRepository = async () => {
    if (!repoToRename || !newRepoNameForRename.trim()) return;
    if (!profile?.github_pat_token) {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `To rename repositories, please set up your GitHub Personal Access Token first.`,
      });
      showTokenPopup();
      return;
    }

    setIsRenamingRepo(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${repoToRename.full_name}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${profile.github_pat_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRepoNameForRename.trim(),
        }),
      });

      if (response.ok) {
        const updatedRepo = await response.json();
        setRepositories(prev => prev.map(repo =>
          repo.id === repoToRename.id
            ? { ...repo, name: updatedRepo.name, full_name: updatedRepo.full_name }
            : repo
        ));
        setNewRepoNameForRename("");
        setRepoToRename(null);
        setShowRenameModal(false);
        addChatMessage({
          id: Date.now().toString(),
          role: "assistant",
          content: `🎉 Repository renamed to "${updatedRepo.name}" successfully!`,
        });
      } else {
        throw new Error('Failed to rename repository');
      }
    } catch (error) {
      console.error('Error renaming repository:', error);
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `Failed to rename repository. Please check your GitHub token permissions.`,
      });
    } finally {
      setIsRenamingRepo(false);
    }
  };
  
  const handleDeleteRepo = (repo: GitHubRepo) => {
    setRepoToDelete(repo);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRepo = async () => {
    // ... (copy the entire confirmDeleteRepo function here)
  };

  const handleBulkDelete = async () => {
    // ... (copy the entire handleBulkDelete function here)
  };
  
  const toggleRepoSelection = (repoId: number) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(repoId)) {
        newSet.delete(repoId);
      } else {
        newSet.add(repoId);
      }
      return newSet;
    });
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRepos(new Set());
  };

  const sortRepositoriesByDate = (repos: GitHubRepo[], order: 'newest' | 'oldest' | 'default'): GitHubRepo[] => {
    if (order === 'default') {
      return [...originalRepositories]; // Return to original fetched order
    }
    return [...repos].sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleDateSort = (order: 'newest' | 'oldest' | 'default') => {
    setDateSortOrder(order);
    const sortedRepos = sortRepositoriesByDate(repositories, order);
    setRepositories(sortedRepos);
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
  
  const processMessage = async (currentMessage: string) => {
    // ... (copy the entire processMessage logic from the original page.tsx here)
  };

  const sendDirectMessage = async (message: string) => {
    if (!message.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    setIsAiThinking(true);
    await processMessage(message);
  };
  
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const currentMessage = chatMessage;
    setChatMessage("");
    await sendDirectMessage(currentMessage);
  };
  
  const applyChanges = async () => {
    // ... (copy the entire applyChanges function from the original page.tsx here)
  };
  
  const generateJobTemplate = async () => {
    // ... (copy the entire generateJobTemplate function from the original page.tsx here)
  };
  
  const handleResetChat = () => {
    // ... (copy the entire handleResetChat function from the original page.tsx here)
  };
  
  const downloadPortfolioReadme = () => {
    // ... (copy the entire downloadPortfolioReadme function from the original page.tsx here)
  };
  
  const generateTemplate = async (templateId: string) => {
    // ... (copy the entire generateTemplate function here)
  };

  const generateReadme = async (repo: GitHubRepo) => {
    // ... (copy the entire generateReadme function here)
  };

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);
  
  useEffect(() => {
    const unsubscribe = repositoryManager.subscribe((repos) => {
      console.log(`⚡ Subscribed: Received ${repos.length} repositories`);
      setRepositories(repos);
      if (originalRepositories.length === 0) {
        setOriginalRepositories(repos);
      }
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
        await repositoryManager.fetchRepositories(effectiveToken, true, user.id);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to load repositories.");
      } finally {
        setIsLoadingRepos(false);
        setIsInitialized(true);
      }
    } else if (!loading) {
      setError("GitHub token not found. Please set it in your profile.");
      setIsLoadingRepos(false);
      setIsInitialized(true);
    }
  }, [user, isInitialized, getEffectiveToken, loading]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    // Data & State
    user, profile, loading, error, isLoadingRepos, repositories, selectedRepos, repoToDelete, repoToRename,
    templateResults, hasChanges,
    // UI State & Toggles
    isDeleteMode, showDeleteConfirm, showJobTemplateModal, showAddRepoModal, showRenameModal, isChatMinimized,
    isAiThinking, isCriticMode, isInterviewMode, interviewProgress, generatedReadme,
    // Form State
    jobTitle, newRepoName, newRepoDescription, newRepoNameForRename, chatMessage, dateSortOrder, selectedTemplate,
    // State Setters
    setRepositories, setChatMessage, setShowDeleteConfirm, setShowJobTemplateModal, setShowAddRepoModal,
    setShowRenameModal, setIsChatMinimized, setIsCriticMode, setJobTitle, setNewRepoName, setNewRepoDescription,
    setNewRepoNameForRename, setRepoToRename, setTemplateResults, setSelectedTemplate,
    // Handlers and Logic
    signOut, showTokenPopup, toggleDeleteMode, toggleRepoSelection, handleDeleteRepo, confirmDeleteRepo,
    handleBulkDelete, handleDateSort, onDragEnd, handleSendMessage, sendDirectMessage, applyChanges,
    generateJobTemplate, handleResetChat, downloadPortfolioReadme, createRepository, renameRepository,
    generateTemplate, generateReadme,
    // Loading States
    isDeleting, isGeneratingTemplate, isCreatingRepo, isRenamingRepo,
    // Refs
    chatEndRef,
    // NEW: Export handleRefresh and chatMessages
    handleRefresh,
    chatMessages,
  };
}