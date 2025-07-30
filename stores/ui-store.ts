import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface UIState {
  // Modal states
  showProfileDropdown: boolean;
  showJobTemplateModal: boolean;
  showTokenWarning: boolean;
  
  // Form states
  jobTitle: string;
  jobDescription: string;
  
  // Loading states
  isProcessing: boolean;
  
  // Theme and preferences
  sidebarCollapsed: boolean;
  
  // Actions
  setProfileDropdown: (show: boolean) => void;
  setJobTemplateModal: (show: boolean) => void;
  setTokenWarning: (show: boolean) => void;
  setJobTitle: (title: string) => void;
  setJobDescription: (description: string) => void;
  setProcessing: (processing: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Complex actions
  resetJobForm: () => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    showProfileDropdown: false,
    showJobTemplateModal: false,
    showTokenWarning: false,
    jobTitle: '',
    jobDescription: '',
    isProcessing: false,
    sidebarCollapsed: false,
    
    // Basic setters
    setProfileDropdown: (show) => set({ showProfileDropdown: show }),
    setJobTemplateModal: (show) => set({ showJobTemplateModal: show }),
    setTokenWarning: (show) => set({ showTokenWarning: show }),
    setJobTitle: (title) => set({ jobTitle: title }),
    setJobDescription: (description) => set({ jobDescription: description }),
    setProcessing: (processing) => set({ isProcessing: processing }),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    
    // Complex actions
    resetJobForm: () => set({
      jobTitle: '',
      jobDescription: '',
      showJobTemplateModal: false
    }),
    
    closeAllModals: () => set({
      showProfileDropdown: false,
      showJobTemplateModal: false,
      showTokenWarning: false
    })
  }))
);
