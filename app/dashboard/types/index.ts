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
  created_at: string; // Added for sorting
  private: boolean;
  fork: boolean;
  clone_url?: string; // Optional fields from your original file
  ssh_url?: string;
  pushed_at?: string;
  size?: number;
  default_branch?: string;
  topics?: string[];
  visibility?: string;
  archived?: boolean;
  disabled?: boolean;
  open_issues_count?: number;
  license?: any;
  allow_forking?: boolean;
  is_template?: boolean;
  web_commit_signoff_required?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  has_pages?: boolean;
  has_downloads?: boolean;
  has_discussions?: boolean;
  security_and_analysis?: any;
  parent?: {
    full_name: string;
    html_url: string;
  };
}

