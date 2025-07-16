// Location: src/types/index.ts
// Description: TypeScript type definitions for RepoDock.dev - defines all interfaces and types used throughout the application including User, Workspace, Project, ENV variables, and other core entities

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  encryptionPassword?: string; // Optional encryption password for env variables
  githubUsername?: string;
  githubInstallationId?: string;
  githubInstallationCreatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color for workspace folder
  userId: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  userId: string;
  repository?: string; // GitHub repository URL or full name (owner/repo)
  githubRepoId?: string; // GitHub repository ID for API calls
  githubOwner?: string; // Repository owner/organization
  githubRepo?: string; // Repository name
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string; // Encrypted value
  description?: string;
  isSecret: boolean;
  projectId?: string; // If null, it's a global env variable
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  userId: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'closed' | 'merged' | 'draft';
  url?: string; // GitHub PR URL
  number?: number; // GitHub PR number
  githubId?: string; // GitHub PR ID
  sourceBranch?: string; // Source branch name
  targetBranch?: string; // Target branch name (usually main/master)
  author?: string; // GitHub username of PR author
  authorAvatar?: string; // GitHub avatar URL
  labels?: string; // JSON string of GitHub labels
  assignees?: string; // JSON string of GitHub assignees
  reviewers?: string; // JSON string of GitHub reviewers
  isDraft?: boolean;
  mergeable?: boolean; // Whether PR can be merged
  additions?: number; // Lines added
  deletions?: number; // Lines deleted
  changedFiles?: number; // Number of files changed
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'bug' | 'feature' | 'enhancement' | 'documentation';
  url?: string; // GitHub issue URL
  number?: number; // GitHub issue number
  githubId?: string; // GitHub issue ID
  author?: string; // GitHub username of issue author
  authorAvatar?: string; // GitHub avatar URL
  assignees?: string; // JSON string of GitHub assignees
  labels?: string; // JSON string of GitHub labels
  milestone?: string; // GitHub milestone
  state?: string; // GitHub state (open, closed)
  stateReason?: string; // GitHub state reason (completed, not_planned, reopened)
  comments?: number; // Number of comments
  reactions?: string; // JSON string of GitHub reactions
  locked?: boolean; // Whether issue is locked
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Auth related types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// UI related types
export type Theme = 'light' | 'dark';

export interface AppState {
  theme: Theme;
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  sidebarCollapsed: boolean;
}

// Form types
export interface WorkspaceFormData {
  name: string;
  description?: string;
  color?: string;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  repository?: string;
  status: Project['status'];
}

export interface EnvFormData {
  key: string;
  value: string;
  description?: string;
  isSecret: boolean;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assignedTo?: string;
  dueDate?: string;
}

// Navigation types
export type ProjectTab = 'details' | 'tasks' | 'pr' | 'issues' | 'env';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  children?: NavItem[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'repodock_user',
  WORKSPACES: 'repodock_workspaces',
  PROJECTS: 'repodock_projects',
  ENV_VARIABLES: 'repodock_env_variables',
  TASKS: 'repodock_tasks',
  PULL_REQUESTS: 'repodock_pull_requests',
  ISSUES: 'repodock_issues',
  APP_STATE: 'repodock_app_state',
  THEME: 'repodock_theme',
} as const;

// Encryption types
export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

// GitHub API types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  state_reason?: 'completed' | 'not_planned' | 'reopened';
  user: GitHubUser;
  assignees: GitHubUser[];
  labels: GitHubLabel[];
  milestone?: {
    title: string;
    description?: string;
    state: 'open' | 'closed';
  };
  comments: number;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  locked: boolean;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  }; // Present if this "issue" is actually a pull request
  reactions: {
    total_count: number;
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  user: GitHubUser;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  labels: GitHubLabel[];
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  draft: boolean;
  mergeable?: boolean;
  mergeable_state: string;
  merged: boolean;
  merged_at?: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  additions: number;
  deletions: number;
  changed_files: number;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface FormProps extends BaseComponentProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}
