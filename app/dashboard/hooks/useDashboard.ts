// app/dashboard/hooks/useDashboard.ts
"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRepositories } from "./useRepositories";
import { useChatAssistant } from "./useChatAssistant";

import { useDashboardModals } from "./useDashboardModals";
import { aiAssistant } from "../../../lib/ai-assistant";

export function useDashboard() {
  const { user, profile, loading, signOut, showTokenPopup } = useAuth();
  
  // --- State for features not belonging to other hooks ---
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  // Note: generateTemplate logic would be here or in its own hook

  // --- Instantiate Child Hooks ---

  // Modals hook must be initialized first to provide control functions
  const modals = useDashboardModals();

  // Repositories hook manages all repo data and actions
  const repos = useRepositories(
    // For now, we'll handle chat messages separately
    () => {},
    modals.openModal,             // Pass modal-opening function
    modals.setRepoToDelete,       // Pass state setter
    modals.setRepoToRename        // Pass state setter
  );

  // Chat hook needs the actual repositories for context
  const chat = useChatAssistant(
    repos.repositories // Pass the actual repositories
  );
  
  // --- Connect Hooks ---
  
  // Update chat context when repositories change
  // This is a placeholder; a more robust solution might use a shared context
  // or pass the repositories state directly into the chat hook. For now,
  // we rely on aiAssistant.updateContext being called inside processMessage.
  
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
    
    // From useChatAssistant
    ...chat,

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

    // UI state from the main hook
    isChatMinimized,
    setIsChatMinimized,
    selectedTemplate,
    setSelectedTemplate,
    
    // Placeholder for logic that would live here or in another hook
    generateTemplate: async (templateId: string) => { 
        chat.addChatMessage({ role: 'assistant', content: `Template generation for "${templateId}" is not fully implemented yet.` });
    },
    generateJobTemplate: async () => {
      if (!modals.jobTitle.trim()) return;
      modals.setIsGeneratingTemplate(true);
      
      // Update AI assistant context with current repositories
      aiAssistant.updateUserContext({ repositories: repos.repositories });
      
      // Process the job recommendation request
      const response = await aiAssistant.processMessage(`recommend repositories for ${modals.jobTitle} position`);
      
      chat.addChatMessage({ role: 'assistant', content: response.message });
      if (response.success && response.data?.recommendedRepos) {
        modals.setTemplateResults(response.data.recommendedRepos);
      }
      modals.setIsGeneratingTemplate(false);
    }
  };
}