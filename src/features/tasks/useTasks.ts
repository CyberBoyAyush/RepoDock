// Location: src/features/tasks/useTasks.ts
// Description: Zustand store for task management in RepoDock.dev - handles CRUD operations for tasks, filtering, and task state management within projects

import { create } from 'zustand';
import { Task, TaskFormData } from '@/types';

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
  loadTasks: (projectId: string) => Promise<void>;
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
  loadTasks: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const { tasks } = await response.json();

      set({
        tasks,
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
    console.log('createTask called with:', { data, projectId, userId });
    set({ isLoading: true, error: null });

    try {
      const taskData = {
        title: data.title,
        description: data.description || '',
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        projectId,
        assignedTo: data.assignedTo || '',
        dueDate: data.dueDate || '',
      };

      console.log('Sending task data to API:', taskData);

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error('Failed to create task');
      }

      const { task } = await response.json();
      console.log('Task created successfully:', task);

      // Update state
      const tasks = [...get().tasks, task];
      set({
        tasks,
        isLoading: false,
      });

      return task;
    } catch (error) {
      console.error('createTask error:', error);
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

      // Update in database
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

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

      // Delete from database
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

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
