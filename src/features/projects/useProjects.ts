// Location: src/features/projects/useProjects.ts
// Description: Zustand store for project management in RepoDock.dev - handles CRUD operations for projects, current project selection, and project filtering within workspaces

import { create } from 'zustand';
import { Project, ProjectFormData } from '@/types';
import { dataCache, cacheUtils } from '@/lib/cache';

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
  loadProjects: (workspaceId: string) => Promise<void>;
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
  loadProjects: async (workspaceId: string) => {
    // Check cache first for immediate response
    const cacheKey = cacheUtils.projectsKey(workspaceId);
    const cachedProjects = dataCache.get<Project[]>(cacheKey);

    if (cachedProjects) {
      // Clear current project if it doesn't belong to this workspace
      const currentProject = get().currentProject;
      const validCurrentProject = currentProject &&
        cachedProjects.find((p: Project) => p.id === currentProject.id) ? currentProject : null;

      set({
        projects: cachedProjects,
        currentProject: validCurrentProject,
        isLoading: false,
      });

      // Still fetch fresh data in background
      fetch(`/api/projects?workspaceId=${workspaceId}`)
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(({ projects }) => {
          // Update cache and state if data changed
          if (JSON.stringify(projects) !== JSON.stringify(cachedProjects)) {
            dataCache.set(cacheKey, projects);

            const currentProject = get().currentProject;
            const validCurrentProject = currentProject &&
              projects.find((p: Project) => p.id === currentProject.id) ? currentProject : null;

            set({ projects, currentProject: validCurrentProject });
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
      const response = await fetch(`/api/projects?workspaceId=${workspaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const { projects } = await response.json();

      // Cache the projects
      dataCache.set(cacheKey, projects);

      // Clear current project if it doesn't belong to this workspace
      const currentProject = get().currentProject;
      const validCurrentProject = currentProject &&
        projects.find((p: Project) => p.id === currentProject.id) ? currentProject : null;

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
    console.log('createProject called with:', { data, workspaceId, userId });
    set({ isLoading: true, error: null });

    try {
      const projectData = {
        name: data.name,
        description: data.description || '',
        repository: data.repository || '',
        status: data.status || 'active',
        workspaceId,
      };

      console.log('Sending project data to API:', projectData);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error('Failed to create project');
      }

      const { project } = await response.json();
      console.log('Project created successfully:', project);

      // Update state
      const projects = [...get().projects, project];
      set({
        projects,
        isLoading: false,
      });

      return project;
    } catch (error) {
      console.error('createProject error:', error);
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

      // Update in database
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

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

      // Delete from database
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

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

      const duplicateData: ProjectFormData = {
        name: `${originalProject.name} (Copy)`,
        description: originalProject.description,
        repository: originalProject.repository,
        status: 'draft',
      };

      // Use the createProject method which handles API calls
      const createdProject = await get().createProject(duplicateData, originalProject.workspaceId, userId);

      return createdProject;
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
