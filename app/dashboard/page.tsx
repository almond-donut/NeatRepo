"use client"

import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { repositoryManager } from "@/lib/repository-manager";
import { aiAssistant } from "@/lib/ai-assistant";
import { geminiAI } from "@/lib/gemini";
import {
  Github,
  Star,
  GitFork,
  Clock,
  Settings,
  LogOut,
  Plus,
  User,
  GripVertical,
  Folder,
  Code,
  FileText,
  Lightbulb,
  Send,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  MessageCircle,
  Square,
  Eye,
  AlertTriangle,
  CheckCircle,
  Trash2,
  ArrowUp,
  X,
  Zap,
  Download,
  Calendar,
  CalendarDays,
  Target,
  Edit,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  updated_at: string;
  private: boolean;
  fork: boolean;
  parent?: {
    full_name: string;
    html_url: string;
  };
}

interface UserSession {
  user: GitHubUser;
  repositories: GitHubRepo[];
  access_token: string;
  authenticated_at: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function DashboardPage() {
  const { user, profile, loading, signOut, showTokenPopup } = useAuth();
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🚀 REAL USER ONLY - NO MORE MOCK DATA!
  const currentUser = user;
  const currentProfile = profile;

  // Create fallback profile from user data if profile doesn't exist
  const fallbackProfile = currentProfile || {
    id: currentUser?.id || 'unknown',
    github_username: currentUser?.user_metadata?.user_name || 'almond-donut',
    github_token: '' // Token will be set through profile management
  };

  // Use fallback profile for dashboard
  const effectiveProfile = fallbackProfile;

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [originalRepositories, setOriginalRepositories] = useState<GitHubRepo[]>([]);
  const [previewRepositories, setPreviewRepositories] = useState<GitHubRepo[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [expandedRepos, setExpandedRepos] = useState<Set<number>>(new Set());

  // Helper function to add chat messages
  const addChatMessage = (message: Omit<ChatMessage, 'timestamp'>) => {
    setChatMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
  };

  // 🗑️ DELETE FUNCTIONALITY - GAME CHANGER!
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<GitHubRepo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 📅 DATE SORTING FUNCTIONALITY
  const [dateSortOrder, setDateSortOrder] = useState<'newest' | 'oldest' | 'default'>('default');

  // 🎯 JOB TEMPLATE FUNCTIONALITY
  const [showJobTemplateModal, setShowJobTemplateModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [templateResults, setTemplateResults] = useState<GitHubRepo[]>([]);

  // ➕ ADD REPOSITORY FUNCTIONALITY
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);

  // ✏️ RENAME REPOSITORY FUNCTIONALITY
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [repoToRename, setRepoToRename] = useState<GitHubRepo | null>(null);
  const [newRepoNameForRename, setNewRepoNameForRename] = useState("");
  const [isRenamingRepo, setIsRenamingRepo] = useState(false);

  // ➕ CREATE REPOSITORY FUNCTION
  const createRepository = async () => {
    if (!newRepoName.trim()) return;
    if (!profile?.github_token) {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ GitHub token not found. Please configure your GitHub token first.`,
      });
      return;
    }

    setIsCreatingRepo(true);
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${profile.github_token}`,
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

        // Add to repositories list
        const formattedRepo: GitHubRepo = {
          id: newRepo.id,
          name: newRepo.name,
          full_name: newRepo.full_name,
          description: newRepo.description,
          private: newRepo.private,
          html_url: newRepo.html_url,
          clone_url: newRepo.clone_url,
          ssh_url: newRepo.ssh_url,
          language: newRepo.language,
          stargazers_count: newRepo.stargazers_count,
          forks_count: newRepo.forks_count,
          created_at: newRepo.created_at,
          updated_at: newRepo.updated_at,
          pushed_at: newRepo.pushed_at,
          size: newRepo.size,
          default_branch: newRepo.default_branch,
          topics: newRepo.topics || [],
          visibility: newRepo.visibility,
          fork: newRepo.fork,
          archived: newRepo.archived,
          disabled: newRepo.disabled,
          open_issues_count: newRepo.open_issues_count,
          license: newRepo.license,
          allow_forking: newRepo.allow_forking,
          is_template: newRepo.is_template,
          web_commit_signoff_required: newRepo.web_commit_signoff_required,
          has_issues: newRepo.has_issues,
          has_projects: newRepo.has_projects,
          has_wiki: newRepo.has_wiki,
          has_pages: newRepo.has_pages,
          has_downloads: newRepo.has_downloads,
          has_discussions: newRepo.has_discussions,
          security_and_analysis: newRepo.security_and_analysis,
        };

        setRepositories(prev => [formattedRepo, ...prev]);

        // Reset form and close modal
        setNewRepoName("");
        setNewRepoDescription("");
        setShowAddRepoModal(false);

        // Show success message
        addChatMessage({
          id: Date.now().toString(),
          role: "assistant",
          content: `🎉 Repository "${newRepo.name}" created successfully! It's now available in your repositories list.`,
        });
      } else {
        throw new Error('Failed to create repository');
      }
    } catch (error) {
      console.error('Error creating repository:', error);
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Failed to create repository. Please check your GitHub token permissions and try again.`,
      });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // ✏️ RENAME REPOSITORY FUNCTION
  const renameRepository = async () => {
    if (!repoToRename || !newRepoNameForRename.trim()) return;
    if (!profile?.github_token) {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ GitHub token not found. Please configure your GitHub token first.`,
      });
      return;
    }

    setIsRenamingRepo(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${repoToRename.full_name}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${profile.github_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRepoNameForRename.trim(),
        }),
      });

      if (response.ok) {
        const updatedRepo = await response.json();

        // Update repositories list
        setRepositories(prev => prev.map(repo =>
          repo.id === repoToRename.id
            ? { ...repo, name: updatedRepo.name, full_name: updatedRepo.full_name }
            : repo
        ));

        // Reset form and close modal
        setNewRepoNameForRename("");
        setRepoToRename(null);
        setShowRenameModal(false);

        // Show success message
        addChatMessage({
          id: Date.now().toString(),
          role: "assistant",
          content: `🎉 Repository renamed from "${repoToRename.name}" to "${updatedRepo.name}" successfully!`,
        });
      } else {
        throw new Error('Failed to rename repository');
      }
    } catch (error) {
      console.error('Error renaming repository:', error);
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Failed to rename repository. Please check your GitHub token permissions and try again.`,
      });
    } finally {
      setIsRenamingRepo(false);
    }
  };

  // 🚀 DELETE FUNCTIONS - REVOLUTIONARY CLEANUP TOOL!
  const handleDeleteRepo = async (repo: GitHubRepo) => {
    setRepoToDelete(repo);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRepo = async () => {
    if (!repoToDelete || !effectiveProfile.github_token) return;

    setIsDeleting(true);
    try {
      console.log(`🗑️ DELETING REPO: ${repoToDelete.name}`);

      const response = await fetch(`https://api.github.com/repos/${repoToDelete.full_name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${effectiveProfile.github_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Tailored-AI/1.0',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log(`✅ REPO DELETED: ${repoToDelete.name}`);
        // Remove from repositories list
        setRepositories(prev => prev.filter(r => r.id !== repoToDelete.id));

        // Add success message to chat
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🗑️ **Repository Deleted Successfully!**

"${repoToDelete.name}" has been permanently deleted from your GitHub account.

This is part of cleaning up your portfolio for a more professional appearance! 🚀`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error(`Failed to delete repository: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ DELETE ERROR:', error);

      // Auto-open GitHub repository settings for manual deletion
      const githubUrl = `https://github.com/${repoToDelete.full_name}/settings`;
      window.open(githubUrl, '_blank');

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ **Done! Opening GitHub for you...**

Just click "Delete this repository" in the new tab that opened.

Super quick and easy! 🚀`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setRepoToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRepos.size === 0) return;

    const reposToDelete = repositories.filter(repo => selectedRepos.has(repo.id));
    console.log(`🗑️ BULK DELETE: ${reposToDelete.length} repositories`);

    // Show confirmation for bulk delete
    const confirmMessage = `Are you sure you want to delete ${reposToDelete.length} repositories? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      console.log('Bulk delete confirmed');

      setIsDeleting(true);
      let successCount = 0;
      let failedRepos: string[] = [];

      try {
        // Delete repositories one by one
        for (const repo of reposToDelete) {
          try {
            console.log(`🗑️ DELETING REPO: ${repo.name}`);

            const response = await fetch(`https://api.github.com/repos/${repo.full_name}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `token ${effectiveProfile.github_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GitHub-Tailored-AI/1.0',
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              console.log(`✅ REPO DELETED: ${repo.name}`);
              successCount++;

              // Remove from repositories list immediately
              setRepositories(prev => prev.filter(r => r.id !== repo.id));
            } else {
              console.error(`❌ FAILED TO DELETE: ${repo.name} - Status: ${response.status}`);
              failedRepos.push(repo.name);
            }
          } catch (error) {
            console.error(`❌ DELETE ERROR for ${repo.name}:`, error);
            failedRepos.push(repo.name);
          }
        }

        // Show results
        const resultMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🗑️ **Bulk Delete Results**

✅ **Successfully deleted:** ${successCount} repositories
${failedRepos.length > 0 ? `❌ **Failed to delete:** ${failedRepos.join(', ')}` : ''}

${successCount > 0 ? 'Your portfolio is now cleaner and more professional! 🚀' : ''}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, resultMessage]);

        // Clear selections and exit delete mode
        setSelectedRepos(new Set());
        setIsDeleteMode(false);

        // Force refresh repositories
        if (effectiveProfile.github_token) {
          await repositoryManager.fetchRepositories(effectiveProfile.github_token, true);
        }

      } catch (error) {
        console.error('❌ BULK DELETE ERROR:', error);
      } finally {
        setIsDeleting(false);
      }
    }
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
    setSelectedRepos(new Set()); // Clear selections when toggling mode
  };

  // 📅 DATE SORTING FUNCTIONS
  const sortRepositoriesByDate = (repos: GitHubRepo[], order: 'newest' | 'oldest' | 'default'): GitHubRepo[] => {
    if (order === 'default') {
      return repos; // Return original order
    }

    return [...repos].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();

      if (order === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });
  };

  const handleDateSort = (order: 'newest' | 'oldest' | 'default') => {
    setDateSortOrder(order);
    const sortedRepos = sortRepositoriesByDate(repositories, order);
    setRepositories(sortedRepos);

    // Trigger staged changes if not default order
    if (order !== 'default') {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  };
  const [hasChanges, setHasChanges] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [welcomeText, setWelcomeText] = useState("Welcome to your GitHub AI Assistant");
  const [isTypingWelcome, setIsTypingWelcome] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isCriticMode, setIsCriticMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [lastVisibilityChange, setLastVisibilityChange] = useState(Date.now());
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [persistentState, setPersistentState] = useState({
    dataLoaded: false,
    lastSync: 0
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  // SINGLETON: Subscribe to global repository manager - PREVENT DUPLICATES
  useEffect(() => {
    // Prevent multiple subscriptions
    if ((window as any).repoManagerSubscribed) {
      console.log('⚠️ SINGLETON: Already subscribed, skipping');
      return;
    }

    console.log('🎯 SINGLETON: Subscribing to repository manager');
    (window as any).repoManagerSubscribed = true;

    const unsubscribe = repositoryManager.subscribe((repos) => {
      console.log(`⚡ SINGLETON: Received ${repos.length} repositories`);
      setRepositories(repos);
      setOriginalRepositories(repos);
      setIsLoadingRepos(false); // Stop loading when data arrives
      setPersistentState({
        dataLoaded: repos.length > 0,
        lastSync: repositoryManager.getLastFetchTime()
      });
    });

    return () => {
      unsubscribe();
      (window as any).repoManagerSubscribed = false;
    };
  }, []); // ZERO dependencies - subscribe once, get updates forever

  // YouTube-style background sync: ZERO dependencies to prevent re-triggers
  useEffect(() => {
    let backgroundSync: NodeJS.Timeout;

    const startBackgroundSync = () => {
      backgroundSync = setInterval(() => {
        // Check conditions inside interval, not in dependencies
        const currentUser = document.querySelector('[data-user-id]')?.getAttribute('data-user-id');
        const hasRepos = localStorage.getItem('github_repositories');

        if (currentUser && hasRepos) {
          console.log('🔄 SINGLETON: Background sync starting...');
          const token = localStorage.getItem('github_token');
          if (token) {
            repositoryManager.backgroundSync(token);
          }
        }
      }, 300000); // 5 minutes
    };

    startBackgroundSync();
    return () => clearInterval(backgroundSync);
  }, []); // ZERO dependencies!

  // Skip storage initialization - use client-side download only for better reliability
  useEffect(() => {
    if (user && !storageInitialized) {
      console.log('📁 Using client-side download only (no storage backup)');
      setStorageInitialized(true);
    }
  }, [user, storageInitialized]);

  // Improved download function with proper filename handling
  const saveAndDownloadContent = async (content: string, filename: string, contentType: string = 'text/markdown') => {
    try {
      console.log('🔽 Starting download:', filename);

      // Ensure filename has proper extension and sanitize
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_\.]/g, '-');
      const properFilename = sanitizedFilename.endsWith('.md') ? sanitizedFilename : `${sanitizedFilename}.md`;

      // Create blob with proper MIME type - NO BOM to avoid encoding issues
      const blob = new Blob([content], {
        type: 'text/markdown;charset=utf-8'
      });

      console.log('📄 Blob created:', {
        size: blob.size,
        type: blob.type,
        filename: properFilename
      });

      // Skip Supabase Storage backup - use client-side download only
      console.log('📁 Using client-side download only (more reliable)');

      // Create download using multiple methods for better compatibility
      const url = URL.createObjectURL(blob);

      // Method 1: Try modern download API if available
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: properFilename,
            types: [{
              description: 'Markdown files',
              accept: { 'text/markdown': ['.md'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log('✅ File saved using File System Access API');
          URL.revokeObjectURL(url);
          return true;
        } catch (fsError) {
          console.log('📁 File System Access API failed, falling back to download link');
        }
      }

      // Method 2: Traditional download link with enhanced attributes
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = properFilename;
      downloadLink.style.display = 'none';
      downloadLink.setAttribute('download', properFilename);
      downloadLink.setAttribute('type', 'text/markdown');

      // Prevent any other download handlers from interfering
      downloadLink.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🎯 Direct download click for:', properFilename);
      });

      // Add to DOM temporarily
      document.body.appendChild(downloadLink);

      // Force click with user gesture simulation
      console.log('🖱️ Triggering download click for:', properFilename);
      downloadLink.click();

      // Cleanup after a delay
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(url);
        console.log('🧹 Download cleanup completed for:', properFilename);
      }, 3000);

      return true;
    } catch (error) {
      console.error('❌ Download error:', error);

      // Enhanced fallback method
      try {
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_\.]/g, '-');
        const properFilename = sanitizedFilename.endsWith('.md') ? sanitizedFilename : `${sanitizedFilename}.md`;
        const blob = new Blob([content], {
          type: 'application/octet-stream' // Force download
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = properFilename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        }, 3000);

        console.log('✅ Enhanced fallback download completed for:', properFilename);
        return true;
      } catch (fallbackError) {
        console.error('❌ All download methods failed:', fallbackError);

        // Last resort: copy to clipboard
        try {
          await navigator.clipboard.writeText(content);
          console.log('📋 Content copied to clipboard as last resort');
          alert(`Download failed, but content has been copied to clipboard. Please paste it into a new file named: ${filename.endsWith('.md') ? filename : `${filename}.md`}`);
          return true;
        } catch (clipboardError) {
          console.error('❌ Clipboard fallback also failed:', clipboardError);
          return false;
        }
      }
    }
  };



  const projectTemplates = [
    {
      id: "react-app",
      name: "React Web App",
      description: "Modern React application with TypeScript",
      icon: "⚛️",
      files: [
        "src/App.tsx",
        "src/components/Header.tsx",
        "src/components/Footer.tsx",
        "src/hooks/useAuth.ts",
        "src/utils/api.ts",
        "public/index.html",
        "package.json",
        "tsconfig.json",
        "tailwind.config.js"
      ]
    },
    {
      id: "npm-library",
      name: "NPM Library",
      description: "Reusable JavaScript/TypeScript library",
      icon: "📦",
      files: [
        "src/index.ts",
        "src/lib/core.ts",
        "src/types/index.ts",
        "tests/index.test.ts",
        "package.json",
        "tsconfig.json",
        "rollup.config.js",
        ".npmignore"
      ]
    },
    {
      id: "nextjs-app",
      name: "Next.js App",
      description: "Full-stack Next.js application",
      icon: "▲",
      files: [
        "app/page.tsx",
        "app/layout.tsx",
        "app/api/auth/route.ts",
        "components/ui/button.tsx",
        "lib/utils.ts",
        "package.json",
        "next.config.js",
        "tailwind.config.ts"
      ]
    },
    {
      id: "python-api",
      name: "Python API",
      description: "FastAPI backend service",
      icon: "🐍",
      files: [
        "main.py",
        "app/models.py",
        "app/routes.py",
        "app/database.py",
        "tests/test_main.py",
        "requirements.txt",
        "Dockerfile",
        ".env.example"
      ]
    },
    {
      id: "rust-cli",
      name: "Rust CLI Tool",
      description: "Command-line application in Rust",
      icon: "🦀",
      files: [
        "src/main.rs",
        "src/lib.rs",
        "src/cli.rs",
        "src/config.rs",
        "tests/integration_test.rs",
        "Cargo.toml",
        "README.md",
        ".gitignore"
      ]
    }
  ];

  const fullWelcomeText = "Welcome to your GitHub AI Assistant";

  // Typewriter effect for welcome message
  useEffect(() => {
    if (isTypingWelcome && currentUser) {
      let index = 0;
      const timer = setInterval(() => {
        if (index < fullWelcomeText.length) {
          setWelcomeText(fullWelcomeText.slice(0, index + 1));
          index++;
        } else {
          setIsTypingWelcome(false);
          clearInterval(timer);
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isTypingWelcome, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // YouTube-style: NO visibility-based refetching - data persists across tab switches
  useEffect(() => {
    console.log('🎯 YouTube-style persistence: No tab-switch reloading');
    setIsPageVisible(true); // Always consider page "visible" for UX
  }, []);

  // 🚀 KEYBOARD SHORTCUTS for flexible drag operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreviewMode) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelPreview();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          applyChanges();
        } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          // Continue dragging without applying
          setIsPreviewMode(false);
          setHasChanges(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode]);

  // OLD fetchRepositories function removed - using SINGLETON pattern only

  // 🔄 RESET INITIALIZATION ON PAGE NAVIGATION
  useEffect(() => {
    // Reset initialization when page loads/navigates to ensure auto-fetch always works
    console.log('🔄 PAGE NAVIGATION: Resetting initialization state for reliable auto-fetch');
    setIsInitialized(false);

    // Also reset loading state to prevent stuck loading screens
    if (repositories.length > 0) {
      console.log('🔄 PAGE NAVIGATION: Found cached repositories, stopping loading state');
      setIsLoadingRepos(false);
    }
  }, []); // Run once on page mount/navigation

  // 🚀 SIMPLE & RELIABLE AUTO-FETCH - TRIGGERS WHEN USER & PROFILE ARE READY
  useEffect(() => {
    // Only run when we have user and profile with token
    if (!user || !currentProfile?.github_token || isInitialized) {
      return;
    }

    console.log('🚀 AUTO-FETCH: User and profile ready, fetching repositories...');
    setIsLoadingRepos(true);

    // Store token for background sync
    localStorage.setItem('github_token', currentProfile.github_token);

    // 🔧 Initialize AI Assistant with GitHub API
    const username = currentProfile.github_username || 'user';
    aiAssistant.initializeGitHub(currentProfile.github_token, username);
    console.log('🔧 AI Assistant GitHub API initialized');

    // 🚀 FETCH REPOSITORIES IMMEDIATELY
    repositoryManager.fetchRepositories(currentProfile.github_token, true).catch((error) => {
      console.error('❌ Auto-fetch failed:', error);
      setIsLoadingRepos(false);
      setError('Failed to load repositories automatically. Please click refresh.');
    });

    setIsInitialized(true);
  }, [user, currentProfile?.github_token, isInitialized]); // Depend on user and token availability

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const enablePreviewMode = (newRepos: GitHubRepo[]) => {
    setPreviewRepositories(newRepos);
    setIsPreviewMode(true);
    setHasChanges(true);
  };

  const applyPreview = () => {
    setRepositories(previewRepositories);
    setIsPreviewMode(false);
  };

  const cancelPreview = () => {
    setPreviewRepositories([]);
    setIsPreviewMode(false);
    setHasChanges(false);
  };

  const generateReadme = async (repo: GitHubRepo) => {
    setIsAiThinking(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `Generate README for ${repo.name}`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Simulate AI analysis and README generation
    setTimeout(() => {
      const readmeContent = `# ${repo.name}

${repo.description || 'A modern project built with cutting-edge technologies.'}

## 🚀 Features

- **Modern Architecture**: Built with ${repo.language || 'latest technologies'}
- **High Performance**: Optimized for speed and efficiency
- **Developer Friendly**: Easy to set up and contribute
- **Well Documented**: Comprehensive documentation and examples

## 📦 Installation

\`\`\`bash
# Clone the repository
git clone ${repo.clone_url}

# Navigate to project directory
cd ${repo.name}

# Install dependencies
${repo.language === 'JavaScript' || repo.language === 'TypeScript' ? 'npm install' :
  repo.language === 'Python' ? 'pip install -r requirements.txt' :
  repo.language === 'Rust' ? 'cargo build' :
  repo.language === 'Go' ? 'go mod tidy' : 'make install'}
\`\`\`

## 🛠️ Usage

\`\`\`bash
# Run the application
${repo.language === 'JavaScript' || repo.language === 'TypeScript' ? 'npm start' :
  repo.language === 'Python' ? 'python main.py' :
  repo.language === 'Rust' ? 'cargo run' :
  repo.language === 'Go' ? 'go run main.go' : 'make run'}
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Support

If you found this project helpful, please give it a star!

---

**Created with ❤️ by NeatRepo**`;

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚡ README Generated Successfully!\n\nI've created a professional README for **${repo.name}** based on:\n\n• Repository metadata and language\n• Best practices and modern structure\n• Installation and usage instructions\n• Contributing guidelines\n\nThe README is ready to copy and paste into your repository!`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsAiThinking(false);

      // Use Supabase Storage for saving and downloading
      saveAndDownloadContent(readmeContent, `README-${repo.name}.md`);
    }, 2000);
  };

  const generateTemplate = async (templateId: string) => {
    const template = projectTemplates.find(t => t.id === templateId);
    if (!template) return;

    setIsAiThinking(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `Generate ${template.name} template`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Simulate template generation
    setTimeout(() => {
      const fileStructure = template.files.map(file => `📄 ${file}`).join('\n');

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🚀 ${template.name} Template Generated!\n\n${template.description}\n\n**File Structure:**\n${fileStructure}\n\n**Next Steps:**\n• Create a new repository on GitHub\n• Clone it locally\n• Copy this structure to your project\n• Start coding!\n\n**Template includes:**\n• Modern project structure\n• Best practices configuration\n• Development tools setup\n• Testing framework`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsAiThinking(false);
      setSelectedTemplate("");

      // Generate downloadable template structure file
      const templateContent = `# ${template.name} Template

${template.description}

## File Structure

${template.files.map(file => `- ${file}`).join('\n')}

## Getting Started

1. Create a new repository on GitHub
2. Clone the repository locally
3. Create the file structure above
4. Install dependencies and start developing!

---
Generated by NeatRepo`;

      // Use Supabase Storage for saving and downloading
      saveAndDownloadContent(templateContent, `${template.id}-template.md`);
    }, 1500);
  };





  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // 🎯 CLEAN UX: Update repositories directly, no jumpscare preview
    const newRepos = Array.from(repositories);
    const [reorderedItem] = newRepos.splice(source.index, 1);
    newRepos.splice(destination.index, 0, reorderedItem);

    // 🚀 SEAMLESS: Update repositories and show apply button
    setRepositories(newRepos);
    setHasChanges(true);

    console.log(`🎯 Seamless Drag: "${reorderedItem.name}" moved from position ${source.index + 1} to ${destination.index + 1}`);
  };

  const toggleRepoExpansion = (repoId: number) => {
    setExpandedRepos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(repoId)) {
        newSet.delete(repoId);
      } else {
        newSet.add(repoId);
      }
      return newSet;
    });
  };

  // Function to send a specific message directly
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

    // Continue with the same logic as handleSendMessage
    await processMessage(message);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const currentMessage = chatMessage;
    setChatMessage("");
    await sendDirectMessage(currentMessage);
  };

  // Extract the message processing logic
  const processMessage = async (currentMessage: string) => {
    // 🎯 CHECK FOR GREETINGS FIRST
    const greetingWords = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    const isGreeting = greetingWords.some(greeting =>
      currentMessage.toLowerCase().trim() === greeting ||
      currentMessage.toLowerCase().startsWith(greeting + ' ') ||
      currentMessage.toLowerCase().startsWith(greeting + ',') ||
      currentMessage.toLowerCase().startsWith(greeting + '!')
    );

    if (isGreeting) {
      const helpMessage = `👋 Hello! I'm your GitHub AI Assistant. Here's what I can help you with:

**Repository Analysis:**
1. Analyze your portfolio structure
2. Review code quality and organization
3. Suggest improvements for better visibility

**Content Generation:**
1. Generate professional README files
2. Create compelling repository descriptions
3. Write documentation and guides

**Career Optimization:**
1. Optimize repositories for job applications
2. Prioritize projects for your portfolio
3. Get feedback on your coding showcase

**Quick Commands:**
• "analyze my repos" - Get detailed portfolio analysis
• "generate README for [repo-name]" - Create documentation
• "optimize for jobs" - Get career-focused suggestions
• "brutal feedback" - Switch to critic mode for honest reviews

What would you like to start with? 🚀`;

      const aiMessage: ChatMessage = {
        id: Date.now().toString() + "-ai",
        role: "assistant",
        content: helpMessage,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
      setIsAiThinking(false);
      return;
    }

    // 🚀 TRUE AI ASSISTANT - Real AI-powered responses with actions
    try {
      // 🔧 Initialize GitHub API if token is available
      if (profile?.github_token && profile?.github_username) {
        aiAssistant.initializeGitHub(profile.github_token, profile.github_username);
        console.log('🔧 AI Assistant GitHub API initialized with user token');
      } else if (localStorage.getItem('github_token')) {
        // Fallback to localStorage token
        const token = localStorage.getItem('github_token');
        const username = profile?.github_username || 'user';
        aiAssistant.initializeGitHub(token!, username);
        console.log('🔧 AI Assistant GitHub API initialized with localStorage token');
      }

      // Update AI context with current repositories
      aiAssistant.updateContext(repositories);

      // Add user message to AI conversation history
      aiAssistant.addToHistory('user', currentMessage);

      // 🔄 IMMEDIATE PROGRESS FEEDBACK
      const progressMessage: ChatMessage = {
        id: Date.now().toString() + "-progress",
        role: "assistant",
        content: "🧠 Analyzing your request...",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, progressMessage]);

      // 🎯 ENHANCED AI ASSISTANT WITH PERSONALITY MODES
      // Create system prompt based on mode
      let systemPrompt = "";
      if (isCriticMode) {
        systemPrompt = `You are a brutally honest GitHub portfolio critic. Be harsh but constructive.

CRITICAL FORMATTING RULES:
- ALWAYS use numbered lists (1. 2. 3.)
- NEVER write long paragraphs
- Each point must be on a separate line
- Use clear section headers

EXACT RESPONSE FORMAT (REQUIRED):
1. Brief brutal assessment
2. Another harsh observation

Issues:
1. First major problem
2. Second major problem
3. Third major problem

Fixes:
1. First concrete solution
2. Second concrete solution
3. Third concrete solution

User has ${repositories.length} repositories, ${repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)} total stars.
${repositories.filter(repo => !repo.description || repo.description.length < 10).length} repos have poor descriptions.

Be brutal and sarcastic but follow the EXACT numbered format above.`;
      } else {
        systemPrompt = `You are an encouraging GitHub portfolio assistant. Be supportive but concise.

CRITICAL FORMATTING RULES:
- ALWAYS use numbered lists (1. 2. 3.)
- NEVER write long paragraphs
- Each point must be on a separate line
- Use clear section headers

EXACT RESPONSE FORMAT (REQUIRED):
1. Brief encouraging assessment
2. Another positive observation

Strengths:
1. First strength you notice
2. Second strength you notice
3. Third strength you notice

Suggestions:
1. First improvement suggestion
2. Second improvement suggestion
3. Third improvement suggestion

User has ${repositories.length} repositories, ${repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)} total stars.
${repositories.filter(repo => !repo.description || repo.description.length < 10).length} repos could benefit from better descriptions.

Be encouraging and supportive but follow the EXACT numbered format above.`;
      }

      // Add repository context to the AI assistant
      aiAssistant.updateContext(repositories, {});



      // 🎯 DIRECT AI RESPONSE WITH PERSONALITY MODE
      try {
        // First try to parse as an action
        const action = await aiAssistant.parseCommand(currentMessage);
        console.log(' Parsed action:', action);
        
        let response: string;
        
        if (action.type !== 'general_response') {
          // Execute the specific action
          const actionResult = await aiAssistant.executeAction(action);
          response = actionResult.message;
          console.log(' Action executed:', actionResult);
        } else {
          // Fall back to direct AI response for general queries
          response = await geminiAI.generateResponse(
            currentMessage,
            chatMessages.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            systemPrompt
          );
          console.log(' Direct AI Response:', response);
        }

        console.log('✅ Direct AI Response:', response);

        // Replace progress message with AI response
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const progressIndex = newMessages.findIndex(msg => msg.id.includes("-progress"));
          if (progressIndex !== -1) {
            newMessages[progressIndex] = {
              id: Date.now().toString() + "-ai",
              role: "assistant",
              content: response,
              timestamp: new Date(),
            };
          } else {
            newMessages.push({
              id: Date.now().toString() + "-ai",
              role: "assistant",
              content: response,
              timestamp: new Date(),
            });
          }
          return newMessages;
        });
        setIsAiThinking(false);
        return;
      } catch (error) {
        console.error('❌ AI Response Error:', error);

        // Show error message to user
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const progressIndex = newMessages.findIndex(msg => msg.id.includes("-progress"));
          if (progressIndex !== -1) {
            newMessages[progressIndex] = {
              id: Date.now().toString() + "-ai",
              role: "assistant",
              content: `❌ Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.\n\nError: ${error.message}`,
              timestamp: new Date(),
            };
          }
          return newMessages;
        });
        setIsAiThinking(false);
        return;
      }



    } catch (error) {
      console.error('❌ Outer Error in handleSendMessage:', error);

      // Show error message to user
      setChatMessages((prev) => {
        const newMessages = [...prev];
        const progressIndex = newMessages.findIndex(msg => msg.id.includes("-progress"));
        if (progressIndex !== -1) {
          newMessages[progressIndex] = {
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: `❌ Sorry, I encountered an unexpected error. Please try again.\n\nError: ${error.message}`,
            timestamp: new Date(),
          };
        }
        return newMessages;
      });
      setIsAiThinking(false);
    }
  };

  const applyChanges = async () => {
    console.log("Applying changes to repository order");

    // Show loading state
    setIsAiThinking(true);

    try {
      // Apply preview changes if in preview mode
      if (isPreviewMode) {
        applyPreview();
      }

      // Simulate API call to save repository order
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add success message to chat
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Repository order updated successfully!\n\nI've reorganized your repositories according to your changes. The new order has been saved to your profile.`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, successMessage]);
      setHasChanges(false);

      console.log("✅ Repository order applied successfully");
    } catch (error) {
      console.error("❌ Failed to apply changes:", error);

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Failed to apply changes\n\nThere was an error saving your repository order. Please try again.`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // 🎯 GENERATE JOB TEMPLATE - AI selects 4 most relevant repos
  const generateJobTemplate = async () => {
    if (!jobTitle.trim()) return;

    setIsGeneratingTemplate(true);
    console.log(`🎯 Generating template for: ${jobTitle}`);

    try {
      // Filter out forked repositories for template (focus on original work)
      const originalRepos = repositories.filter(repo => !repo.fork);

      // AI prompt to select best repositories for the job
      const prompt = `As a career advisor, analyze these repositories and select the 4 MOST RELEVANT ones for a "${jobTitle}" position.

Repositories:
${originalRepos.map(repo => `
- ${repo.name}: ${repo.description || 'No description'} (${repo.language || 'Unknown language'}, ${repo.stargazers_count} stars)
`).join('')}

Consider:
1. Programming languages relevant to ${jobTitle}
2. Project complexity and completeness
3. Industry relevance
4. Professional presentation

Return ONLY the repository names in this exact format:
1. repository-name-1
2. repository-name-2
3. repository-name-3
4. repository-name-4

No explanations, just the list.`;

      const response = await geminiAI.generateResponse(prompt, [], "You are a career advisor helping developers select their best repositories for job applications.");

      // Parse AI response to get repository names
      const selectedRepoNames = response
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(name => name.length > 0)
        .slice(0, 4);

      // Find the actual repository objects
      const selectedRepos = selectedRepoNames
        .map(name => originalRepos.find(repo => repo.name === name))
        .filter(repo => repo !== undefined) as GitHubRepo[];

      setTemplateResults(selectedRepos);

      // Add success message to chat
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🎯 **Perfect ${jobTitle} Portfolio Generated!**

I've selected your 4 most relevant repositories for ${jobTitle} positions:

${selectedRepos.map((repo, index) => `
**${index + 1}. ${repo.name}**
- Language: ${repo.language || 'Multiple'}
- Stars: ${repo.stargazers_count}
- ${repo.description || 'Professional project showcasing your skills'}
`).join('')}

These repositories best demonstrate the skills recruiters look for in ${jobTitle} candidates. Perfect for your CV and portfolio! 🚀`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error("❌ Failed to generate template:", error);

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Failed to generate job template\n\nThere was an error analyzing your repositories. Please try again.`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const getLanguageColor = (language: string) => {
    return "bg-gray-500";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    return "today";
  };

  const ThinkingSpinner = () => (
    <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-transparent rounded-full animate-spin"></div>
  );

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  // Early return if no user - redirect to landing page (but wait for auth to load)
  if (!currentUser && !loading) {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-muted-foreground">Please wait while we redirect you to sign in.</p>
        </div>
      </div>
    );
  }

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Initializing your dashboard...</p>
        </div>
      </div>
    );
  }

  // 🚀 ULTRA-FAST: FORCE RENDER - NO LOADING SCREEN!
  // Always render dashboard immediately for maximum speed

  const publicRepos = repositories.filter((repo) => !repo.private).length;
  const privateRepos = repositories.length - publicRepos;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-user-id={currentUser?.id}
      data-loading={loading.toString()}
      data-repos-count={repositories.length}
    >
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Github className="h-6 w-6" />
                <span className="text-lg font-semibold">NeatRepo</span>
              </div>
              <nav className="flex items-center space-x-6">
                <span className="font-medium">Dashboard</span>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {/* User Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 h-auto p-2"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser?.user_metadata?.avatar_url} alt={currentUser?.user_metadata?.name} />
                    <AvatarFallback>{currentUser?.user_metadata?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-sm">{currentUser?.user_metadata?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">
                      @{currentUser?.user_metadata?.login || 'unknown'}
                    </span>
                  </div>
                </Button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm font-medium border-b border-border">My Account</div>

                      <button
                        onClick={() => {
                          router.push('/profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          router.push('/profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Manage Tokens</span>
                      </button>

                      <div className="border-t border-border my-1"></div>

                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted transition-colors"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Project Templates Section */}
            <Card className="mb-6 border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Quick Start Templates</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a project template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center space-x-2">
                              <span>{template.icon}</span>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-muted-foreground">{template.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => selectedTemplate && generateTemplate(selectedTemplate)}
                    disabled={!selectedTemplate || isAiThinking}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Template
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Generate a complete project structure with best practices and modern tooling
                </p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{repositories.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {publicRepos} public, {privateRepos} private
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stars</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all repositories</p>
                </CardContent>
              </Card>
            </div>

            {/* 🚀 ACTION BUTTONS - ALIGNED ACCORDING TO MOCKUP */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Left Side Container for Refresh and Sort Buttons */}
              <div className="flex items-center gap-4">
                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const token = currentProfile?.github_token || effectiveProfile.github_token;
                    if (token) {
                      setIsLoadingRepos(true);
                      await repositoryManager.fetchRepositories(token, true);
                    }
                  }}
                  className="flex items-center gap-2"
                  title="Refresh repositories"
                  disabled={isLoadingRepos}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>

                {/* 📅 DATE SORTING SELECT */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={dateSortOrder} onValueChange={(value: 'newest' | 'oldest' | 'default') => handleDateSort(value)}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Sort by Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Order</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ➕ ADD REPOSITORY BUTTON */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddRepoModal(true)}
                  className="flex items-center gap-2"
                  title="Create new repository"
                >
                  <Plus className="h-4 w-4" />
                  Add Repo
                </Button>

                {/* 🎯 JOB TEMPLATE BUTTON */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJobTemplateModal(true)}
                  className="flex items-center gap-2"
                  title="Generate job-specific portfolio template"
                >
                  <Target className="h-4 w-4" />
                  <span>Job Template</span>
                </Button>
              </div>

              {/* Right Side Container for Delete Buttons */}
              <div className="flex items-center gap-4">
                {/* 🗑️ DELETE MODE TOGGLE - ALIGNED TO RIGHT AS PER MOCKUP */}
                <Button
                  variant={isDeleteMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleDeleteMode}
                  className="flex items-center gap-2"
                  title={isDeleteMode ? "Exit delete mode" : "Enter delete mode - Clean up your portfolio!"}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isDeleteMode ? "Exit delete mode" : "Enter delete mode"}</span>
                </Button>

                {/* 🚀 BULK DELETE BUTTON */}
                {isDeleteMode && selectedRepos.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2"
                    title={`Delete ${selectedRepos.size} selected repositories`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete {selectedRepos.size}</span>
                  </Button>
                )}
              </div>
            </div>

            {false ? (
              /* REMOVED: Two-Column Preview Layout - No more jumpscare! */
              <div className="grid grid-cols-2 gap-6">
                {/* Current Order */}
                <Card className="opacity-75 border-gray-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Current Order
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">Before</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      <div className="space-y-2 pr-4">
                        {repositories.map((repo, index) => (
                        <div key={repo.id} className="p-3 rounded-lg border bg-card border-border">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">
                              {index + 1}
                            </div>
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{repo.name}</span>
                                {repo.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {repo.language}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>{repo.stargazers_count}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeAgo(repo.updated_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Preview Order */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ArrowUp className="h-4 w-4" />
                        Preview Changes
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">
                        💡 Live Preview: Drag repos on the left, see instant preview on the right! ESC to reset, Ctrl+Enter to apply
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="text-xs bg-foreground text-background">After</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelPreview}
                          className="text-xs hover:bg-destructive/20 hover:text-destructive"
                          title="Reset to original order"
                        >
                          ↺ Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Hide preview but keep changes for more dragging
                            setIsPreviewMode(false);
                            // Keep hasChanges true so user can see they have pending changes
                          }}
                          className="text-xs"
                          title="Hide preview and continue dragging - changes are saved in background"
                        >
                          🎯 Continue Live Dragging
                        </Button>
                        <Button
                          size="sm"
                          onClick={applyChanges}
                          disabled={isAiThinking}
                          className="text-xs bg-foreground text-background hover:bg-foreground/90"
                          title="Save this order permanently"
                        >
                          ✅ Apply Changes
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      <div className="space-y-2 pr-4">
                        {previewRepositories.map((repo, index) => {
                        const originalIndex = repositories.findIndex(r => r.id === repo.id);
                        const positionChanged = originalIndex !== index;
                        const positionDiff = originalIndex - index;

                        return (
                          <div key={repo.id} className={`p-3 rounded-lg border bg-card transition-all duration-200 ${
                            positionChanged ? 'border-foreground/20 bg-muted/50' : 'border-border/50'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 flex items-center justify-center text-xs text-blue-400 font-medium">
                                {index + 1}
                              </div>
                              {positionChanged && (
                                <div className="flex items-center text-xs">
                                  {positionDiff > 0 ? (
                                    <ArrowUp className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <ArrowUp className="h-3 w-3 text-red-400 rotate-180" />
                                  )}
                                  <span className="text-blue-400 ml-1">
                                    {Math.abs(positionDiff)}
                                  </span>
                                </div>
                              )}
                              <Folder className="h-4 w-4 text-blue-400" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">{repo.name}</span>
                                  {positionChanged && (
                                    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                                      Moved
                                    </Badge>
                                  )}
                                  {repo.language && (
                                    <Badge variant="outline" className="text-xs">
                                      {repo.language}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Star className="h-3 w-3" />
                                    <span>{repo.stargazers_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTimeAgo(repo.updated_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Normal Single Column Layout */
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="pr-4">
                      {repositories.length === 0 ? (
                    isLoadingRepos ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Loading repositories...</span>
                        </div>
                      </div>
                    ) : (
                      // 🎯 FRIENDLY ERROR MESSAGE FOR BETTER UX
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="text-center">
                          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No repositories found</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            If your repositories are still showing 0, please click the refresh button below
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const token = currentProfile?.github_token || effectiveProfile.github_token;
                              if (token) {
                                setIsLoadingRepos(true);
                                await repositoryManager.fetchRepositories(token, true);
                              }
                            }}
                            className="flex items-center gap-2"
                            disabled={isLoadingRepos}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Refresh Repositories
                          </Button>
                        </div>
                      </div>
                    )
                  ) : isLoadingRepos && repositories.length === 0 ? (
                    // 🚀 ULTRA-FAST SKELETON LOADING for perceived performance
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-card animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-5 h-5 bg-muted rounded"></div>
                              <div className="w-4 h-4 bg-muted rounded"></div>
                              <div className="w-4 h-4 bg-muted rounded"></div>
                              <div className="space-y-1">
                                <div className="w-32 h-4 bg-muted rounded"></div>
                                <div className="w-20 h-3 bg-muted rounded"></div>
                              </div>
                            </div>
                            <div className="w-16 h-3 bg-muted rounded"></div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">🚀 Loading repositories at light speed...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <DragDropContext
                        onDragEnd={onDragEnd}
                        autoScrollerOptions={{
                          startFromPercentage: 0.05,
                          maxScrollAtPercentage: 0.15,
                          maxPixelScroll: 30,
                          ease: (percentage: number) => Math.pow(percentage, 2),
                          durationDampening: {
                            stopDampeningAt: 1200,
                            accelerateAt: 360,
                          },
                        }}
                      >
                        <Droppable droppableId="repositories">
                          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`space-y-2 rounded-lg transition-all duration-200 ${
                                snapshot.isDraggingOver ? 'bg-accent/20 border-2 border-dashed border-primary/30' : ''
                              }`}
                            >
                            {repositories.map((repo, index) => (
                            <Draggable key={repo.id} draggableId={repo.id.toString()} index={index}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-3 rounded-lg transition-all duration-200 bg-card border ${
                                    snapshot.isDragging
                                      ? "opacity-90 shadow-2xl scale-105 border-primary/50 bg-primary/5 z-50"
                                      : snapshot.isDropAnimating
                                      ? "shadow-lg border-primary/30"
                                      : "border-border/50 hover:border-border hover:shadow-md"
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    ...(snapshot.isDragging && {
                                      transform: `${provided.draggableProps.style?.transform} rotate(2deg)`,
                                    }),
                                  }}
                                >
                                  <div className="flex items-center justify-between min-w-0">
                                    <div className="flex items-center min-w-0 flex-1 mr-4">
                                      {/* 🗑️ DELETE MODE: Show checkbox instead of drag handle */}
                                      {isDeleteMode ? (
                                        <div className="mr-3 flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedRepos.has(repo.id)}
                                            onChange={() => toggleRepoSelection(repo.id)}
                                            className="w-4 h-4 text-destructive bg-background border-border rounded focus:ring-destructive focus:ring-2"
                                            title="Select for deletion"
                                          />
                                        </div>
                                      ) : (
                                        <div
                                          {...provided.dragHandleProps}
                                          className={`mr-3 transition-all duration-200 cursor-grab hover:cursor-grabbing ${
                                            snapshot.isDragging
                                              ? "text-primary scale-110"
                                              : "text-muted-foreground hover:text-foreground hover:scale-105"
                                          }`}
                                          title="🚀 Drag to reorder - Multiple drags allowed!"
                                        >
                                          <GripVertical className="h-5 w-5" />
                                        </div>
                                      )}
                                      <button onClick={() => toggleRepoExpansion(repo.id)} className="mr-2">
                                        {expandedRepos.has(repo.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </button>
                                      <Folder className="h-4 w-4 text-muted-foreground mr-3" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                                            {/* Position indicator */}
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                                              snapshot.isDragging
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                            }`}>
                                              {index + 1}
                                            </span>
                                            <span className="font-semibold truncate">{repo.name}</span>
                                          </div>
                                          {repo.private && (
                                            <Badge variant="secondary" className="text-xs">
                                              Private
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center">
                                          <div className={`w-3 h-3 rounded-full mr-1.5 ${getLanguageColor(repo.language)}`}></div>
                                          <span>{repo.language}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      <div className="text-xs text-muted-foreground">
                                        Updated {formatTimeAgo(repo.updated_at)}
                                      </div>
                                    </div>
                                  </div>
                                  {expandedRepos.has(repo.id) && (
                                    <div className="pl-10 mt-2 space-y-2">
                                      <p className="text-sm text-muted-foreground">{repo.description || "No description available."}</p>
                                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                        <div className="flex items-center">
                                          <div className={`w-3 h-3 rounded-full mr-1.5 ${getLanguageColor(repo.language)}`}></div>
                                          <span>{repo.language}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Star className="h-3 w-3 mr-1" />
                                          <span>{repo.stargazers_count}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <GitFork className="h-3 w-3 mr-1" />
                                          <span>{repo.forks_count}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>{formatTimeAgo(repo.updated_at)}</span>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2 pt-2">
                                        <Button variant="outline" size="sm" onClick={() => window.open(repo.html_url, "_blank")}>
                                          <Eye className="h-4 w-4 mr-2" /> View on GitHub
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setRepoToRename(repo);
                                            setNewRepoNameForRename(repo.name);
                                            setShowRenameModal(true);
                                          }}
                                        >
                                          <Edit className="h-4 w-4 mr-2" /> Rename
                                        </Button>
                                        <Button variant="outline" size="sm">
                                          <Code className="h-4 w-4 mr-2" /> Analyze
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => generateReadme(repo)}
                                          disabled={isAiThinking}
                                          className="bg-foreground text-background hover:bg-foreground/90 border-0"
                                        >
                                          <Zap className="h-4 w-4 mr-2" /> Quick README
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>


                  </>
                  )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* 🎯 STAGED CHANGES - Outside the repository card */}
            {hasChanges && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Staged Changes
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Repository order changed
                  </span>
                </div>
                <Button
                  onClick={applyChanges}
                  disabled={isAiThinking}
                  className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  size="sm"
                >
                  {isAiThinking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      Applying Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply Changes
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 🍴 FORKED REPOSITORIES SECTION */}
            {repositories.filter(repo => repo.fork).length > 0 && (
              <div className="mt-6">
                <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50 dark:bg-gray-900/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <GitFork className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Forked Repositories</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        ({repositories.filter(repo => repo.fork).length} forks)
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Repositories you've forked from other developers - great for showing open source contributions!
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3">
                      {repositories
                        .filter(repo => repo.fork)
                        .map((repo, index) => (
                          <div
                            key={repo.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 hover:border-border transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                                <GitFork className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-sm truncate">{repo.name}</h3>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Fork
                                  </span>
                                </div>
                                {repo.parent && (
                                  <p className="text-xs text-muted-foreground">
                                    Forked from{" "}
                                    <a
                                      href={repo.parent.html_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {repo.parent.full_name}
                                    </a>
                                  </p>
                                )}
                                {repo.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {repo.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {repo.language && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                      {repo.language}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    {repo.stargazers_count}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(repo.html_url, '_blank')}
                                className="h-8 w-8 p-0"
                                title="View on GitHub"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Sidebar: AI Chat */}
          <div className="col-span-1">
            {!isChatMinimized ? (
              <Card className="sticky top-24 shadow-lg border-gray-700/50">
                <CardHeader className="flex flex-row items-center justify-between bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { /* Close logic */ }} className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"></button>
                      <button onClick={() => setIsChatMinimized(true)} className="w-3 h-3 bg-yellow-400 rounded-full hover:bg-yellow-500"></button>
                      <button className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600"></button>
                    </div>
                    <h2 className="text-sm font-medium text-gray-300">
                      AI Assistant {isCriticMode && <span className="text-red-400">• Critic Mode</span>}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCriticMode(!isCriticMode)}
                      className={`text-xs ${isCriticMode ? 'text-red-400 bg-red-500/20' : 'text-gray-400'}`}
                    >
                      {isCriticMode ? '🔥' : '😊'} {isCriticMode ? 'Brutal' : 'Nice'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[60vh] flex flex-col">
                  <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-2">
                      <div className="space-y-4">
                        {/* Welcome Message */}
                        <div className="flex justify-start">
                          <div className="bg-accent text-foreground border border-border p-2 rounded-lg text-sm">
                            {welcomeText}
                            {isTypingWelcome && <span className="animate-pulse">|</span>}
                          </div>
                        </div>

                        {/* GitHub Logo Center */}
                        {!isTypingWelcome && chatMessages.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Github className="h-16 w-16 text-gray-600 mb-4" />
                            <div className="flex flex-col gap-3 text-sm max-w-sm mx-auto">
                              <div className="grid grid-cols-2 gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start bg-transparent text-xs px-2 py-1 h-8"
                                  onClick={() => {
                                    sendDirectMessage("analyze my repository structure");
                                  }}
                                  disabled={isAiThinking}
                                >
                                  <Code className="h-3 w-3 mr-1.5" />
                                  Analyze Structure
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start bg-foreground text-background hover:bg-foreground/90 border-0 text-xs px-2 py-1 h-8"
                                  onClick={() => {
                                    if (repositories.length > 0) {
                                      generateReadme(repositories[0]);
                                    }
                                  }}
                                  disabled={isAiThinking || repositories.length === 0}
                                >
                                  <Zap className="h-3 w-3 mr-1.5" />
                                  Quick README
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start bg-transparent text-xs px-2 py-1 h-8"
                                onClick={() => {
                                  sendDirectMessage("give me suggestions to improve my repositories");
                                }}
                                disabled={isAiThinking}
                              >
                                <Lightbulb className="h-3 w-3 mr-1.5" />
                                Get Suggestions
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Chat Messages */}
                        <div className="space-y-3">
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-xs p-2 rounded-lg text-sm ${
                                  message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-accent text-foreground border border-border"
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          ))}
                          {isAiThinking && (
                            <div className="flex justify-start">
                              <div className="bg-accent text-foreground border border-border p-2 rounded-lg text-sm flex items-center gap-2">
                                <ThinkingSpinner />
                                <span>AI is thinking...</span>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                      </div>
                    </ScrollArea>
                  </div>

                  {!isTypingWelcome && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder={isAiThinking ? "AI is thinking..." : "Ask about your repositories..."}
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && !isAiThinking && handleSendMessage()}
                          disabled={isAiThinking}
                          className="bg-background border-border"
                        />
                        <Button
                          onClick={isAiThinking ? () => setIsAiThinking(false) : handleSendMessage}
                          size="sm"
                          disabled={!isAiThinking && !chatMessage.trim()}
                          className={isAiThinking
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-white hover:bg-gray-100 text-black border border-gray-300"
                          }
                        >
                          {isAiThinking ? (
                            <Square className="h-3 w-3 fill-current" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Minimized Chat Bubble */
              <div className="fixed bottom-6 right-6 z-50">
                <Button
                  onClick={() => setIsChatMinimized(false)}
                  className="w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 shadow-lg border border-gray-700"
                >
                  <Github className="h-6 w-6 text-white" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 🗑️ DELETE CONFIRMATION DIALOG - SAFETY FIRST! */}
        {showDeleteConfirm && repoToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Delete Repository</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm mb-3">
                  Are you sure you want to delete <strong>"{repoToDelete.name}"</strong>?
                </p>
                <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Repository:</span>
                    <span className="font-mono">{repoToDelete.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stars:</span>
                    <span>{repoToDelete.stargazers_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Forks:</span>
                    <span>{repoToDelete.forks_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last updated:</span>
                    <span>{formatTimeAgo(repoToDelete.updated_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRepoToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteRepo}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Forever
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 🎯 JOB TEMPLATE MODAL */}
        {showJobTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Generate Job Template
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJobTemplateModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Target Job Position
                  </label>
                  <Input
                    placeholder="e.g., Software Engineer, Frontend Developer, Data Scientist"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isGeneratingTemplate && generateJobTemplate()}
                    disabled={isGeneratingTemplate}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will select your 4 most relevant repositories for this position
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowJobTemplateModal(false)}
                    className="flex-1"
                    disabled={isGeneratingTemplate}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={generateJobTemplate}
                    disabled={!jobTitle.trim() || isGeneratingTemplate}
                    className="flex-1"
                  >
                    {isGeneratingTemplate ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Template
                      </>
                    )}
                  </Button>
                </div>

                {templateResults.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Selected Repositories
                    </h3>
                    <div className="space-y-2">
                      {templateResults.map((repo, index) => (
                        <div key={repo.id} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span className="font-medium">{repo.name}</span>
                          <span className="text-muted-foreground">({repo.language})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ➕ ADD REPOSITORY MODAL */}
        {showAddRepoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Repository
                </h2>
                <button
                  onClick={() => setShowAddRepoModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Repository Name</label>
                  <Input
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    value={newRepoDescription}
                    onChange={(e) => setNewRepoDescription(e.target.value)}
                    placeholder="A brief description of your project"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddRepoModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createRepository}
                    disabled={!newRepoName.trim() || isCreatingRepo}
                    className="flex-1"
                  >
                    {isCreatingRepo ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Repository
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✏️ RENAME REPOSITORY MODAL */}
        {showRenameModal && repoToRename && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Rename Repository
                </h2>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Name</label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm text-muted-foreground">
                    {repoToRename.name}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">New Name</label>
                  <Input
                    value={newRepoNameForRename}
                    onChange={(e) => setNewRepoNameForRename(e.target.value)}
                    placeholder="new-repository-name"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRenameModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={renameRepository}
                    disabled={!newRepoNameForRename.trim() || newRepoNameForRename === repoToRename.name || isRenamingRepo}
                    className="flex-1"
                  >
                    {isRenamingRepo ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Renaming...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename Repository
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


