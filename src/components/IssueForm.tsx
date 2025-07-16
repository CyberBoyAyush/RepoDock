// Location: src/components/IssueForm.tsx
// Description: Issue form component for RepoDock.dev - handles creation and editing of issues with validation, GitHub integration, and modern form design

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Issue } from '@/types';
import { issueSchema } from '@/lib/zodSchemas';
import { Bug, Lightbulb, Plus, BookOpen, GitBranch } from 'lucide-react';

interface IssueFormProps {
  projectId: string;
  issue?: Issue;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IssueForm({ projectId, issue, onSuccess, onCancel }: IssueFormProps) {
  const [formData, setFormData] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    type: issue?.type || 'bug',
    priority: issue?.priority || 'medium',
    status: issue?.status || 'open',
    assignedTo: '',
  });
  const [createOnGitHub, setCreateOnGitHub] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!issue;

  const typeOptions = [
    { value: 'bug', label: 'Bug', icon: Bug },
    { value: 'feature', label: 'Feature', icon: Lightbulb },
    { value: 'enhancement', label: 'Enhancement', icon: Plus },
    { value: 'documentation', label: 'Documentation', icon: BookOpen },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ];

  const validateForm = () => {
    const result = issueSchema.safeParse(formData);

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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isEditing 
        ? `/api/issues/${issue.id}` 
        : `/api/projects/${projectId}/issues`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const requestBody = {
        ...formData,
        createOnGitHub: !isEditing && createOnGitHub, // Only for new issues
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save issue');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save issue:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to save issue' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Issue Title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          placeholder="Enter issue title"
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status}</p>
              )}
            </div>
          )}
        </div>

        <Input
          label="Assigned To (GitHub username)"
          type="text"
          value={formData.assignedTo}
          onChange={(e) => handleInputChange('assignedTo', e.target.value)}
          error={errors.assignedTo}
          placeholder="Enter GitHub username (optional)"
        />

        {!isEditing && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createOnGitHub"
              checked={createOnGitHub}
              onCheckedChange={(checked) => setCreateOnGitHub(checked === true)}
            />
            <label htmlFor="createOnGitHub" className="text-sm text-foreground flex items-center space-x-2">
              <GitBranch className="w-4 h-4" />
              <span>Create issue on GitHub (if repository is connected)</span>
            </label>
          </div>
        )}
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-border">
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
          disabled={isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? 'Saving...' : isEditing ? 'Update Issue' : 'Create Issue'}
        </Button>
      </div>
    </form>
  );
}
