// Location: src/features/workspaces/useWorkspaces.ts
// Description: Zustand store for workspace management in RepoDock.dev - handles CRUD operations for workspaces, current workspace selection, and workspace-related state management

import { create } from 'zustand';
import { Workspace, WorkspaceFormData } from '@/types';
import { dataCache, cacheUtils } from '@/lib/cache';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

interface WorkspaceActions {
  loadWorkspaces: (userId: string) => Promise<void>;
  createWorkspace: (data: WorkspaceFormData, userId: string) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<WorkspaceFormData>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentWorkspaceById: (id: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  getWorkspaceById: (id: string) => Workspace | null;
  duplicateWorkspace: (id: string, userId: string) => Promise<Workspace>;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaces = create<WorkspaceStore>((set, get) => ({
  // Initial state
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  // Actions
  loadWorkspaces: async (userId: string) => {
    // Check cache first for immediate response
    const cacheKey = cacheUtils.workspacesKey(userId);
    const cachedWorkspaces = dataCache.get<Workspace[]>(cacheKey);

    if (cachedWorkspaces) {
      // Set default workspace if none is current
      let currentWorkspace = get().currentWorkspace;
      if (!currentWorkspace && cachedWorkspaces.length > 0) {
        currentWorkspace = cachedWorkspaces.find((w: Workspace) => w.isDefault) || cachedWorkspaces[0];
      }

      set({
        workspaces: cachedWorkspaces,
        currentWorkspace,
        isLoading: false,
      });

      // Still fetch fresh data in background
      fetch('/api/workspaces')
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(({ workspaces }) => {
          // Update cache and state if data changed
          if (JSON.stringify(workspaces) !== JSON.stringify(cachedWorkspaces)) {
            dataCache.set(cacheKey, workspaces);

            let currentWorkspace = get().currentWorkspace;
            if (!currentWorkspace && workspaces.length > 0) {
              currentWorkspace = workspaces.find((w: Workspace) => w.isDefault) || workspaces[0];
            }

            set({ workspaces, currentWorkspace });
          }
        })
        .catch(() => {
          // Background fetch failed, but we have cached data so it's okay
        });

      return; // Return early with cached data
    }

    // No cache, fetch normally
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/workspaces');
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const { workspaces } = await response.json();

      // Cache the workspaces
      dataCache.set(cacheKey, workspaces);

      // Set default workspace if none is current
      let currentWorkspace = get().currentWorkspace;
      if (!currentWorkspace && workspaces.length > 0) {
        currentWorkspace = workspaces.find((w: Workspace) => w.isDefault) || workspaces[0];
      }

      set({
        workspaces,
        currentWorkspace,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to load workspaces',
        isLoading: false,
      });
    }
  },

  createWorkspace: async (data: WorkspaceFormData, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create workspace');
      }

      const { workspace } = await response.json();

      // Update cache
      const cacheKey = cacheUtils.workspacesKey(userId);
      const cachedWorkspaces = dataCache.get<Workspace[]>(cacheKey) || [];
      dataCache.set(cacheKey, [...cachedWorkspaces, workspace]);

      // Update state
      const workspaces = [...get().workspaces, workspace];
      set({
        workspaces,
        isLoading: false,
      });

      return workspace;
    } catch (error) {
      set({
        error: 'Failed to create workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  updateWorkspace: async (id: string, data: Partial<WorkspaceFormData>) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update workspace');
      }

      // Update state
      const workspaces = get().workspaces.map(workspace =>
        workspace.id === id
          ? { ...workspace, ...data, updatedAt: new Date().toISOString() }
          : workspace
      );

      // Update current workspace if it's the one being updated
      const currentWorkspace = get().currentWorkspace;
      const updatedCurrentWorkspace = currentWorkspace?.id === id
        ? { ...currentWorkspace, ...data, updatedAt: new Date().toISOString() }
        : currentWorkspace;

      set({
        workspaces,
        currentWorkspace: updatedCurrentWorkspace,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to update workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const { workspaces, currentWorkspace } = get();
      
      // Don't allow deleting the last workspace
      if (workspaces.length <= 1) {
        set({
          error: 'Cannot delete the last workspace',
          isLoading: false,
        });
        throw new Error('Cannot delete the last workspace');
      }

      // Delete from database
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }

      // Update state
      const updatedWorkspaces = workspaces.filter(w => w.id !== id);
      
      // If deleting current workspace, set a new current workspace
      let newCurrentWorkspace = currentWorkspace;
      if (currentWorkspace?.id === id) {
        newCurrentWorkspace = updatedWorkspaces.find(w => w.isDefault) || updatedWorkspaces[0];
      }

      set({
        workspaces: updatedWorkspaces,
        currentWorkspace: newCurrentWorkspace,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to delete workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace: Workspace | null) => {
    set({ currentWorkspace: workspace });
  },

  setCurrentWorkspaceById: (id: string) => {
    const workspace = get().workspaces.find(w => w.id === id);
    if (workspace) {
      set({ currentWorkspace: workspace });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  getWorkspaceById: (id: string) => {
    return get().workspaces.find(w => w.id === id) || null;
  },

  duplicateWorkspace: async (id: string, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const originalWorkspace = get().workspaces.find(w => w.id === id);
      if (!originalWorkspace) {
        throw new Error('Workspace not found');
      }

      const duplicateData = {
        name: `${originalWorkspace.name} (Copy)`,
        description: originalWorkspace.description,
        color: originalWorkspace.color,
      };

      // Use the createWorkspace method which handles API calls
      const createdWorkspace = await get().createWorkspace(duplicateData, userId);

      return createdWorkspace;
    } catch (error) {
      set({
        error: 'Failed to duplicate workspace',
        isLoading: false,
      });
      throw error;
    }
  },
}));
