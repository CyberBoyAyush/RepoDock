// Location: src/lib/zodSchemas.ts
// Description: Zod validation schemas for RepoDock.dev - defines validation rules for all forms and data structures including auth, workspaces, projects, and environment variables

import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Workspace schemas
export const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export const workspaceUpdateSchema = workspaceSchema.partial();

// Project schemas
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  repository: z
    .string()
    .url('Please enter a valid repository URL')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'archived', 'draft']).default('active'),
});

export const projectUpdateSchema = projectSchema.partial();

// Environment variable schemas
export const envVariableSchema = z.object({
  key: z
    .string()
    .min(1, 'Environment variable key is required')
    .max(100, 'Key must be less than 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Key must start with a letter and contain only uppercase letters, numbers, and underscores')
    .trim(),
  value: z
    .string()
    .min(1, 'Environment variable value is required')
    .max(10000, 'Value must be less than 10000 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  isSecret: z.boolean().default(false),
});

export const envVariableUpdateSchema = envVariableSchema.partial();

// Task schemas
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['todo', 'in-progress', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z
    .string()
    .max(100, 'Assigned to must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  dueDate: z
    .string()
    .datetime('Please enter a valid date')
    .optional()
    .or(z.literal('')),
});

export const taskUpdateSchema = taskSchema.partial();

// Pull Request schemas
export const pullRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Pull request title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['open', 'closed', 'merged', 'draft']).default('open'),
  sourceBranch: z
    .string()
    .min(1, 'Source branch is required')
    .max(100, 'Branch name must be less than 100 characters')
    .trim(),
  targetBranch: z
    .string()
    .min(1, 'Target branch is required')
    .max(100, 'Branch name must be less than 100 characters')
    .trim(),
});

export const pullRequestUpdateSchema = pullRequestSchema.partial();

// Issue schemas
export const issueSchema = z.object({
  title: z
    .string()
    .min(1, 'Issue title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['open', 'closed', 'in-progress']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  type: z.enum(['bug', 'feature', 'enhancement', 'documentation']).default('bug'),
  assignedTo: z
    .string()
    .max(100, 'Assigned to must be less than 100 characters')
    .optional()
    .or(z.literal('')),
});

export const issueUpdateSchema = issueSchema.partial();

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().max(200, 'Search query must be less than 200 characters'),
  type: z.enum(['all', 'workspaces', 'projects', 'tasks', 'issues', 'env']).default('all'),
});

export const filterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Settings schemas
export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  sidebarCollapsed: z.boolean().default(false),
  notifications: z.object({
    email: z.boolean().default(true),
    desktop: z.boolean().default(false),
    tasks: z.boolean().default(true),
    pullRequests: z.boolean().default(true),
    issues: z.boolean().default(true),
  }).default({
    email: true,
    desktop: false,
    tasks: true,
    pullRequests: true,
    issues: true,
  }),
});

// Import/Export schemas
export const exportSchema = z.object({
  includeWorkspaces: z.boolean().default(true),
  includeProjects: z.boolean().default(true),
  includeTasks: z.boolean().default(true),
  includeEnvVariables: z.boolean().default(false), // Sensitive data
  includePullRequests: z.boolean().default(true),
  includeIssues: z.boolean().default(true),
  format: z.enum(['json', 'csv']).default('json'),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type WorkspaceFormData = z.infer<typeof workspaceSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type EnvVariableFormData = z.infer<typeof envVariableSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type PullRequestFormData = z.infer<typeof pullRequestSchema>;
export type IssueFormData = z.infer<typeof issueSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type FilterFormData = z.infer<typeof filterSchema>;
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
export type ExportFormData = z.infer<typeof exportSchema>;
