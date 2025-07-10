// Location: src/features/tasks/TaskForm.tsx
// Description: Task form component for RepoDock.dev - handles creation and editing of tasks with validation, priority selection, due dates, and assignment features

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth/useAuth';
import { useTasks } from '@/features/tasks/useTasks';
import { taskSchema, type TaskFormData } from '@/lib/zodSchemas';
import { Task } from '@/types';
import { Calendar, User, Flag } from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ task, projectId, onSuccess, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const { createTask, updateTask, isLoading, error, clearError } = useTasks();

  const isEditing = !!task;

  const validateForm = () => {
    const result = taskSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      if (result.error?.issues) {
        result.error.issues.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
      }
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    try {
      if (isEditing && task) {
        await updateTask(task.id, formData);
      } else {
        await createTask(formData, projectId, user.id);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Task form error:', error);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear global error
    if (error) {
      clearError();
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'cancelled':
        return 'destructive';
      case 'todo':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Task Title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          placeholder="Enter task title"
          required
          autoFocus
        />

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter task description (optional)"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          {errors.description && (
            <p className="text-sm text-destructive" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none flex items-center space-x-2">
              <Flag className="w-4 h-4" />
              <span>Priority</span>
              <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <Badge variant={getPriorityColor(formData.priority)}>
                {formData.priority}
              </Badge>
            </div>
            {errors.priority && (
              <p className="text-sm text-destructive" role="alert">
                {errors.priority}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Status
              <span className="text-destructive ml-1">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <Badge variant={getStatusColor(formData.status)}>
                {formData.status === 'in-progress' ? 'In Progress' : formData.status}
              </Badge>
            </div>
            {errors.status && (
              <p className="text-sm text-destructive" role="alert">
                {errors.status}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Assigned To</span>
            </label>
            <Input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              error={errors.assignedTo}
              placeholder="Enter assignee name or email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Due Date</span>
            </label>
            <Input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              error={errors.dueDate}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {isEditing ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
