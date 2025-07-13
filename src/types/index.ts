// Location: src/types/index.ts
// Description: TypeScript type definitions for RepoDock.dev - defines all interfaces and types used throughout the application including User, Workspace, Project, ENV variables, and other core entities

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  encryptionPassword?: string; // Optional encryption password for env variables
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
  repository?: string;
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
  projectId: string;
  userId: string;
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'closed' | 'in-progress';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug' | 'feature' | 'enhancement' | 'documentation';
  projectId: string;
  userId: string;
  assignedTo?: string;
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
