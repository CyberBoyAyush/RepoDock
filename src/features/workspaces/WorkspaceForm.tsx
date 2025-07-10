// Location: src/features/workspaces/WorkspaceForm.tsx
// Description: Workspace form component for RepoDock.dev - handles creation and editing of workspaces with validation, error handling, and modern form design

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { workspaceSchema, type WorkspaceFormData } from '@/lib/zodSchemas';
import { Workspace } from '@/types';

interface WorkspaceFormProps {
  workspace?: Workspace;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WorkspaceForm({ workspace, onSuccess, onCancel }: WorkspaceFormProps) {
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: workspace?.name || '',
    description: workspace?.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const { createWorkspace, updateWorkspace, isLoading, error, clearError } = useWorkspaces();

  const isEditing = !!workspace;

  const validateForm = () => {
    const result = workspaceSchema.safeParse(formData);

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
      if (isEditing && workspace) {
        await updateWorkspace(workspace.id, formData);
      } else {
        await createWorkspace(formData, user.id);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Workspace form error:', error);
    }
  };

  const handleInputChange = (field: keyof WorkspaceFormData, value: string) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Workspace Name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          placeholder="Enter workspace name"
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
            placeholder="Enter workspace description (optional)"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          {errors.description && (
            <p className="text-sm text-destructive" role="alert">
              {errors.description}
            </p>
          )}
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
          {isEditing ? 'Update Workspace' : 'Create Workspace'}
        </Button>
      </div>
    </form>
  );
}
