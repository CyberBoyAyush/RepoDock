// Location: src/features/projects/ProjectForm.tsx
// Description: Project form component for RepoDock.dev - handles creation and editing of projects with validation, repository URL input, status selection, and modern form design

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { useProjects } from '@/features/projects/useProjects';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { projectFormSchema, type ProjectFormData } from '@/lib/zodSchemas';
import { Project } from '@/types';

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    repository: project?.repository || '',
    status: project?.status || 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const { createProject, updateProject, isLoading, error, clearError } = useProjects();
  const { currentWorkspace } = useWorkspaces();

  const isEditing = !!project;

  const validateForm = () => {
    const result = projectFormSchema.safeParse(formData);

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

    console.log('Form submitted with data:', formData);
    console.log('User:', user);
    console.log('Current workspace:', currentWorkspace);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    if (!user) {
      console.log('No user found');
      return;
    }

    if (!currentWorkspace) {
      console.log('No current workspace found');
      return;
    }

    try {
      console.log('Attempting to create/update project...');

      // Clean formData to convert null to undefined
      const cleanedFormData = {
        ...formData,
        repository: formData.repository || undefined,
      };

      if (isEditing && project) {
        await updateProject(project.id, cleanedFormData);
      } else {
        await createProject(cleanedFormData, currentWorkspace.id, user.id);
      }

      console.log('Project created/updated successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Project form error:', error);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
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

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Please select a workspace first.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Project Name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          placeholder="Enter project name"
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
            placeholder="Enter project description (optional)"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          {errors.description && (
            <p className="text-sm text-destructive" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <Input
          label="Repository URL"
          type="url"
          value={formData.repository || ''}
          onChange={(e) => handleInputChange('repository', e.target.value)}
          error={errors.repository}
          placeholder="https://github.com/username/repository (optional)"
          helperText="Link to your project's repository"
        />

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
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          {errors.status && (
            <p className="text-sm text-destructive" role="alert">
              {errors.status}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {formData.status === 'active' && 'Project is actively being worked on'}
            {formData.status === 'draft' && 'Project is in planning or early development'}
            {formData.status === 'archived' && 'Project is completed or no longer active'}
          </p>
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
          {isEditing ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
