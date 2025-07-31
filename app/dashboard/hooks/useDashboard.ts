// app/dashboard/hooks/useDashboard.ts
"use client"

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRepositories } from "./useRepositories";
import { useChatAssistant } from "./useChatAssistant";
import { useDashboardModals } from "./useDashboardModals";

export function useDashboard() {
  const { user, profile, loading, signOut, showTokenPopup } = useAuth();
  
  // --- State for features not belonging to other hooks ---
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  // Note: generateTemplate logic would be here or in its own hook

  // --- Instantiate Child Hooks ---

  // Modals hook must be initialized first to provide control functions
  const modals = useDashboardModals();

  // Chat hook needs a way to add messages, which it provides itself
  const chat = useChatAssistant(
    // It needs the list of repositories for context
    [] // This will be updated via a useEffect later
  );

  // Repositories hook manages all repo data and actions
  const repos = useRepositories(
    chat.addChatMessage,          // Pass chat function to repo hook
    modals.openModal,             // Pass modal-opening function
    modals.setRepoToDelete,       // Pass state setter
    modals.setRepoToRename        // Pass state setter
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
        console.log("Generating template:", templateId); 
        chat.addChatMessage({ role: 'assistant', content: `Template generation for "${templateId}" is not fully implemented yet.` });
    },
    generateJobTemplate: async () => {
        console.log("Generating job template for:", modals.jobTitle);
        chat.addChatMessage({ role: 'assistant', content: `Job template generation for "${modals.jobTitle}" is not fully implemented yet.` });
    }
  };
}