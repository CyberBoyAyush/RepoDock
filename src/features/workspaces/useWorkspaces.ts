// Location: src/features/workspaces/useWorkspaces.ts
// Description: Zustand store for workspace management in RepoDock.dev - handles CRUD operations for workspaces, current workspace selection, and workspace-related state management

import { create } from 'zustand';
import { Workspace, WorkspaceFormData } from '@/types';
import { localDB } from '@/lib/localdb';
import { generateId } from '@/lib/utils';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

interface WorkspaceActions {
  loadWorkspaces: (userId: string) => void;
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
  loadWorkspaces: (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const workspaces = localDB.getUserWorkspaces(userId);
      
      // Set default workspace if none is current
      let currentWorkspace = get().currentWorkspace;
      if (!currentWorkspace && workspaces.length > 0) {
        currentWorkspace = workspaces.find(w => w.isDefault) || workspaces[0];
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const newWorkspace: Workspace = {
        id: generateId('workspace'),
        name: data.name,
        description: data.description || '',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
      };

      // Save to local database
      localDB.createWorkspace(newWorkspace);

      // Update state
      const workspaces = [...get().workspaces, newWorkspace];
      set({
        workspaces,
        isLoading: false,
      });

      return newWorkspace;
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update in local database
      localDB.updateWorkspace(id, data);

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

      // Delete from local database
      localDB.deleteWorkspace(id);

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

      const duplicatedWorkspace: Workspace = {
        id: generateId('workspace'),
        name: `${originalWorkspace.name} (Copy)`,
        description: originalWorkspace.description,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
      };

      // Save to local database
      localDB.createWorkspace(duplicatedWorkspace);

      // Update state
      const workspaces = [...get().workspaces, duplicatedWorkspace];
      set({
        workspaces,
        isLoading: false,
      });

      return duplicatedWorkspace;
    } catch (error) {
      set({
        error: 'Failed to duplicate workspace',
        isLoading: false,
      });
      throw error;
    }
  },
}));
