// Location: src/features/tasks/useTasks.ts
// Description: Zustand store for task management in RepoDock.dev - handles CRUD operations for tasks, filtering, and task state management within projects

import { create } from 'zustand';
import { Task, TaskFormData } from '@/types';
import { localDB } from '@/lib/localdb';
import { generateId } from '@/lib/utils';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filter: {
    status?: Task['status'];
    priority?: Task['priority'];
    search?: string;
    assignedTo?: string;
  };
}

interface TaskActions {
  loadTasks: (projectId: string) => void;
  createTask: (data: TaskFormData, projectId: string, userId: string) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  getTaskById: (id: string) => Task | null;
  setFilter: (filter: Partial<TaskState['filter']>) => void;
  clearFilter: () => void;
  getFilteredTasks: () => Task[];
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  updateTaskPriority: (id: string, priority: Task['priority']) => Promise<void>;
}

type TaskStore = TaskState & TaskActions;

export const useTasks = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  isLoading: false,
  error: null,
  filter: {},

  // Actions
  loadTasks: (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      const projectTasks = localDB.getProjectTasks(projectId);

      set({
        tasks: projectTasks,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to load tasks',
        isLoading: false,
      });
    }
  },

  createTask: async (data: TaskFormData, projectId: string, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const newTask: Task = {
        id: generateId('task'),
        title: data.title,
        description: data.description || '',
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        projectId,
        userId,
        assignedTo: data.assignedTo || '',
        dueDate: data.dueDate || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to local database
      localDB.createTask(newTask);

      // Update state
      const tasks = [...get().tasks, newTask];
      set({
        tasks,
        isLoading: false,
      });

      return newTask;
    } catch (error) {
      set({
        error: 'Failed to create task',
        isLoading: false,
      });
      throw error;
    }
  },

  updateTask: async (id: string, data: Partial<TaskFormData>) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update in local database
      localDB.updateTask(id, data);

      // Update state
      const tasks = get().tasks.map(task =>
        task.id === id
          ? { ...task, ...data, updatedAt: new Date().toISOString() }
          : task
      );

      set({
        tasks,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to update task',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Delete from local database
      localDB.deleteTask(id);

      // Update state
      const tasks = get().tasks.filter(t => t.id !== id);
      set({
        tasks,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to delete task',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  getTaskById: (id: string) => {
    return get().tasks.find(t => t.id === id) || null;
  },

  setFilter: (filter: Partial<TaskState['filter']>) => {
    set(state => ({
      filter: { ...state.filter, ...filter }
    }));
  },

  clearFilter: () => {
    set({ filter: {} });
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    
    return tasks.filter(task => {
      // Status filter
      if (filter.status && task.status !== filter.status) {
        return false;
      }
      
      // Priority filter
      if (filter.priority && task.priority !== filter.priority) {
        return false;
      }
      
      // Assigned to filter
      if (filter.assignedTo && task.assignedTo !== filter.assignedTo) {
        return false;
      }
      
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        const matchesAssignedTo = task.assignedTo?.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesAssignedTo) {
          return false;
        }
      }
      
      return true;
    });
  },

  updateTaskStatus: async (id: string, status: Task['status']) => {
    await get().updateTask(id, { status });
  },

  updateTaskPriority: async (id: string, priority: Task['priority']) => {
    await get().updateTask(id, { priority });
  },
}));
