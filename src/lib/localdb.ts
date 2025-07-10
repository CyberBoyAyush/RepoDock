// Location: src/lib/localdb.ts
// Description: Local database utilities for RepoDock.dev - handles all localStorage/IndexedDB operations for persisting user data, workspaces, projects, and environment variables locally

import { 
  User, 
  Workspace, 
  Project, 
  EnvVariable, 
  Task, 
  PullRequest, 
  Issue, 
  AppState,
  STORAGE_KEYS 
} from '@/types';

// Generic CRUD operations for localStorage
class LocalDB {
  private static instance: LocalDB;

  private constructor() {}

  public static getInstance(): LocalDB {
    if (!LocalDB.instance) {
      LocalDB.instance = new LocalDB();
    }
    return LocalDB.instance;
  }

  // Generic methods
  private getItem<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return [];
    }
  }

  private setItem<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting ${key} to localStorage:`, error);
    }
  }

  private getSingleItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  }

  private setSingleItem<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting ${key} to localStorage:`, error);
    }
  }

  // User operations
  getUser(): User | null {
    return this.getSingleItem<User>(STORAGE_KEYS.USER);
  }

  setUser(user: User): void {
    this.setSingleItem(STORAGE_KEYS.USER, user);
  }

  removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  // Workspace operations
  getWorkspaces(): Workspace[] {
    return this.getItem<Workspace>(STORAGE_KEYS.WORKSPACES);
  }

  getWorkspace(id: string): Workspace | null {
    const workspaces = this.getWorkspaces();
    return workspaces.find(w => w.id === id) || null;
  }

  createWorkspace(workspace: Workspace): void {
    const workspaces = this.getWorkspaces();
    workspaces.push(workspace);
    this.setItem(STORAGE_KEYS.WORKSPACES, workspaces);
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): void {
    const workspaces = this.getWorkspaces();
    const index = workspaces.findIndex(w => w.id === id);
    if (index !== -1) {
      workspaces[index] = { ...workspaces[index], ...updates, updatedAt: new Date().toISOString() };
      this.setItem(STORAGE_KEYS.WORKSPACES, workspaces);
    }
  }

  deleteWorkspace(id: string): void {
    const workspaces = this.getWorkspaces();
    const filtered = workspaces.filter(w => w.id !== id);
    this.setItem(STORAGE_KEYS.WORKSPACES, filtered);
  }

  getUserWorkspaces(userId: string): Workspace[] {
    return this.getWorkspaces().filter(w => w.userId === userId);
  }

  // Project operations
  getProjects(): Project[] {
    return this.getItem<Project>(STORAGE_KEYS.PROJECTS);
  }

  getProject(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  createProject(project: Project): void {
    const projects = this.getProjects();
    projects.push(project);
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
      this.setItem(STORAGE_KEYS.PROJECTS, projects);
    }
  }

  deleteProject(id: string): void {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    this.setItem(STORAGE_KEYS.PROJECTS, filtered);
  }

  getWorkspaceProjects(workspaceId: string): Project[] {
    return this.getProjects().filter(p => p.workspaceId === workspaceId);
  }

  // Environment variables operations
  getEnvVariables(): EnvVariable[] {
    return this.getItem<EnvVariable>(STORAGE_KEYS.ENV_VARIABLES);
  }

  getEnvVariable(id: string): EnvVariable | null {
    const envVars = this.getEnvVariables();
    return envVars.find(e => e.id === id) || null;
  }

  createEnvVariable(envVar: EnvVariable): void {
    const envVars = this.getEnvVariables();
    envVars.push(envVar);
    this.setItem(STORAGE_KEYS.ENV_VARIABLES, envVars);
  }

  updateEnvVariable(id: string, updates: Partial<EnvVariable>): void {
    const envVars = this.getEnvVariables();
    const index = envVars.findIndex(e => e.id === id);
    if (index !== -1) {
      envVars[index] = { ...envVars[index], ...updates, updatedAt: new Date().toISOString() };
      this.setItem(STORAGE_KEYS.ENV_VARIABLES, envVars);
    }
  }

  deleteEnvVariable(id: string): void {
    const envVars = this.getEnvVariables();
    const filtered = envVars.filter(e => e.id !== id);
    this.setItem(STORAGE_KEYS.ENV_VARIABLES, filtered);
  }

  getGlobalEnvVariables(userId: string): EnvVariable[] {
    return this.getEnvVariables().filter(e => e.userId === userId && !e.projectId);
  }

  getProjectEnvVariables(projectId: string): EnvVariable[] {
    return this.getEnvVariables().filter(e => e.projectId === projectId);
  }

  // Task operations
  getTasks(): Task[] {
    return this.getItem<Task>(STORAGE_KEYS.TASKS);
  }

  getTask(id: string): Task | null {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id) || null;
  }

  createTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
      this.setItem(STORAGE_KEYS.TASKS, tasks);
    }
  }

  deleteTask(id: string): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    this.setItem(STORAGE_KEYS.TASKS, filtered);
  }

  getProjectTasks(projectId: string): Task[] {
    return this.getTasks().filter(t => t.projectId === projectId);
  }

  // App state operations
  getAppState(): AppState | null {
    return this.getSingleItem<AppState>(STORAGE_KEYS.APP_STATE);
  }

  setAppState(state: AppState): void {
    this.setSingleItem(STORAGE_KEYS.APP_STATE, state);
  }

  // Theme operations
  getTheme(): string {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  setTheme(theme: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
  }

  // Clear all data (for logout)
  clearAllData(): void {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  // Initialize default data
  initializeDefaultData(userId: string): void {
    const existingWorkspaces = this.getUserWorkspaces(userId);
    if (existingWorkspaces.length === 0) {
      const defaultWorkspace: Workspace = {
        id: `workspace_${Date.now()}`,
        name: 'Default Workspace',
        description: 'Your default workspace',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      };
      this.createWorkspace(defaultWorkspace);
    }
  }
}

export const localDB = LocalDB.getInstance();
