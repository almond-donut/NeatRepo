// Shared types for the application stores

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
}

export interface GitHubRepo {
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface UserSession {
  user: GitHubUser;
  repositories: GitHubRepo[];
  access_token: string;
  authenticated_at: string;
}

export type SortOrder = 'newest' | 'oldest' | 'default';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AppError {
  message: string;
  code?: string;
  type: 'warning' | 'error' | 'info';
  timestamp: Date;
}
