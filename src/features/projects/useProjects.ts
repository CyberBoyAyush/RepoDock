// Location: src/features/projects/useProjects.ts
// Description: Zustand store for project management in RepoDock.dev - handles CRUD operations for projects, current project selection, and project filtering within workspaces

import { create } from 'zustand';
import { Project, ProjectFormData } from '@/types';
import { localDB } from '@/lib/localdb';
import { generateId } from '@/lib/utils';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    status?: Project['status'];
    search?: string;
  };
}

interface ProjectActions {
  loadProjects: (workspaceId: string) => void;
  createProject: (data: ProjectFormData, workspaceId: string, userId: string) => Promise<Project>;
  updateProject: (id: string, data: Partial<ProjectFormData>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentProjectById: (id: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  getProjectById: (id: string) => Project | null;
  duplicateProject: (id: string, userId: string) => Promise<Project>;
  setFilter: (filter: Partial<ProjectState['filter']>) => void;
  clearFilter: () => void;
  getFilteredProjects: () => Project[];
  archiveProject: (id: string) => Promise<void>;
  unarchiveProject: (id: string) => Promise<void>;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjects = create<ProjectStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  filter: {},

  // Actions
  loadProjects: (workspaceId: string) => {
    set({ isLoading: true, error: null });

    try {
      const projects = localDB.getWorkspaceProjects(workspaceId);
      
      // Clear current project if it doesn't belong to this workspace
      const currentProject = get().currentProject;
      const validCurrentProject = currentProject && 
        projects.find(p => p.id === currentProject.id) ? currentProject : null;

      set({
        projects,
        currentProject: validCurrentProject,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to load projects',
        isLoading: false,
      });
    }
  },

  createProject: async (data: ProjectFormData, workspaceId: string, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const newProject: Project = {
        id: generateId('project'),
        name: data.name,
        description: data.description || '',
        repository: data.repository || '',
        status: data.status || 'active',
        workspaceId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to local database
      localDB.createProject(newProject);

      // Update state
      const projects = [...get().projects, newProject];
      set({
        projects,
        isLoading: false,
      });

      return newProject;
    } catch (error) {
      set({
        error: 'Failed to create project',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProject: async (id: string, data: Partial<ProjectFormData>) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update in local database
      localDB.updateProject(id, data);

      // Update state
      const projects = get().projects.map(project =>
        project.id === id
          ? { ...project, ...data, updatedAt: new Date().toISOString() }
          : project
      );

      // Update current project if it's the one being updated
      const currentProject = get().currentProject;
      const updatedCurrentProject = currentProject?.id === id
        ? { ...currentProject, ...data, updatedAt: new Date().toISOString() }
        : currentProject;

      set({
        projects,
        currentProject: updatedCurrentProject,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to update project',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Delete from local database
      localDB.deleteProject(id);

      // Update state
      const projects = get().projects.filter(p => p.id !== id);
      
      // Clear current project if it's the one being deleted
      const currentProject = get().currentProject;
      const newCurrentProject = currentProject?.id === id ? null : currentProject;

      set({
        projects,
        currentProject: newCurrentProject,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to delete project',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  setCurrentProjectById: (id: string) => {
    const project = get().projects.find(p => p.id === id);
    if (project) {
      set({ currentProject: project });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  getProjectById: (id: string) => {
    return get().projects.find(p => p.id === id) || null;
  },

  duplicateProject: async (id: string, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const originalProject = get().projects.find(p => p.id === id);
      if (!originalProject) {
        throw new Error('Project not found');
      }

      const duplicatedProject: Project = {
        id: generateId('project'),
        name: `${originalProject.name} (Copy)`,
        description: originalProject.description,
        repository: originalProject.repository,
        status: 'draft',
        workspaceId: originalProject.workspaceId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to local database
      localDB.createProject(duplicatedProject);

      // Update state
      const projects = [...get().projects, duplicatedProject];
      set({
        projects,
        isLoading: false,
      });

      return duplicatedProject;
    } catch (error) {
      set({
        error: 'Failed to duplicate project',
        isLoading: false,
      });
      throw error;
    }
  },

  setFilter: (filter: Partial<ProjectState['filter']>) => {
    set(state => ({
      filter: { ...state.filter, ...filter }
    }));
  },

  clearFilter: () => {
    set({ filter: {} });
  },

  getFilteredProjects: () => {
    const { projects, filter } = get();
    
    return projects.filter(project => {
      // Status filter
      if (filter.status && project.status !== filter.status) {
        return false;
      }
      
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(searchLower);
        const matchesDescription = project.description?.toLowerCase().includes(searchLower);
        const matchesRepository = project.repository?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription && !matchesRepository) {
          return false;
        }
      }
      
      return true;
    });
  },

  archiveProject: async (id: string) => {
    await get().updateProject(id, { status: 'archived' });
  },

  unarchiveProject: async (id: string) => {
    await get().updateProject(id, { status: 'active' });
  },
}));
