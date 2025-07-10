// Location: src/components/ProjectEnvVariables.tsx
// Description: Project-specific environment variables component for RepoDock.dev - manages environment variables for individual projects with 256-bit encryption and CRUD operations

'use client';

import * as React from 'react';
import { useState } from 'react';
import { Plus, Key, Eye, EyeOff, Copy, Edit, Trash2, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/useAuth';
import { localDB } from '@/lib/localdb';
import { encryptionService } from '@/lib/encryption';
import { generateId, copyToClipboard } from '@/lib/utils';
import { EnvVariable } from '@/types';

interface ProjectEnvVariablesProps {
  projectId: string;
}

export function ProjectEnvVariables({ projectId }: ProjectEnvVariablesProps) {
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVariable | null>(null);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Load environment variables
  React.useEffect(() => {
    if (user && projectId) {
      const projectEnvVars = localDB.getProjectEnvVariables(projectId);
      setEnvVars(projectEnvVars);
    }
  }, [user, projectId]);

  const filteredEnvVars = envVars.filter(envVar =>
    envVar.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    envVar.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleValueVisibility = (id: string) => {
    setVisibleValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getDecryptedValue = (envVar: EnvVariable): string => {
    if (!user) return '[ERROR: No user]';

    try {
      console.log('Attempting to decrypt project env var:', { id: envVar.id, key: envVar.key, hasValue: !!envVar.value });
      const decrypted = encryptionService.decryptEnvValue(envVar.value, user.id);
      console.log('Decryption successful for project env var:', envVar.key);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed for project env var:', envVar.key, error);
      return '[DECRYPTION_FAILED]';
    }
  };

  const handleCopyValue = async (envVar: EnvVariable) => {
    const decryptedValue = getDecryptedValue(envVar);
    const success = await copyToClipboard(decryptedValue);
    
    if (success) {
      // You could add a toast notification here
      console.log('Value copied to clipboard');
    }
  };

  const handleDeleteEnvVar = (id: string) => {
    if (confirm('Are you sure you want to delete this environment variable?')) {
      localDB.deleteEnvVariable(id);
      setEnvVars(prev => prev.filter(env => env.id !== id));
    }
  };

  const handleEditEnvVar = (envVar: EnvVariable) => {
    setEditingVar(envVar);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingVar(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    // Reload env vars
    if (user && projectId) {
      const projectEnvVars = localDB.getProjectEnvVariables(projectId);
      setEnvVars(projectEnvVars);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Environment Variables</span>
              </CardTitle>
              <CardDescription>
                Manage project-specific environment variables with 256-bit encryption
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          {envVars.length > 0 && (
            <div className="relative p-4 bg-muted/30 rounded-lg">
              <Search className="absolute left-7 top-7 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search environment variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          )}

          {/* Environment Variables List */}
          {filteredEnvVars.length === 0 ? (
            <div className="text-center py-12">
              {envVars.length === 0 ? (
                <>
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Environment Variables</h3>
                  <p className="text-muted-foreground mb-4">
                    Add environment variables specific to this project.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variable
                  </Button>
                </>
              ) : (
                <>
                  <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No environment variables match your search.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEnvVars.map((envVar) => (
                <div
                  key={envVar.id}
                  className="group p-5 rounded-lg border border-border/50 hover:border-border transition-all duration-200 hover:shadow-sm bg-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <Key className="w-4 h-4 text-primary flex-shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-lg truncate">{envVar.key}</span>
                          {envVar.isSecret && (
                            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                              Secret
                            </div>
                          )}
                        </div>
                        {envVar.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {envVar.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => toggleValueVisibility(envVar.id)}
                        title={visibleValues.has(envVar.id) ? 'Hide value' : 'Show value'}
                      >
                        {visibleValues.has(envVar.id) ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => handleCopyValue(envVar)}
                        title="Copy value"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => handleEditEnvVar(envVar)}
                        title="Edit variable"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => handleDeleteEnvVar(envVar.id)}
                        title="Delete variable"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <div className="text-sm">
                      {visibleValues.has(envVar.id) ? (
                        <code className="break-all font-mono text-sm bg-background px-2 py-1 rounded">
                          {getDecryptedValue(envVar)}
                        </code>
                      ) : (
                        <span className="text-muted-foreground font-mono">••••••••••••••••••••••••••••••••</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title={editingVar ? 'Edit Environment Variable' : 'Add Environment Variable'}
        size="md"
      >
        <ProjectEnvVariableForm
          envVar={editingVar}
          projectId={projectId}
          onSuccess={handleSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </>
  );
}

// Form component for environment variables
function ProjectEnvVariableForm({ 
  envVar,
  projectId,
  onSuccess, 
  onCancel
}: { 
  envVar?: EnvVariable | null;
  projectId: string;
  onSuccess: () => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    key: envVar?.key || '',
    value: envVar ? '' : '', // Don't pre-fill value for security
    description: envVar?.description || '',
    isSecret: envVar?.isSecret || false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const isEditing = !!envVar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const encryptedValue = encryptionService.encryptEnvValue(formData.value, user.id);
      
      if (isEditing && envVar) {
        // Update existing variable
        localDB.updateEnvVariable(envVar.id, {
          key: formData.key,
          value: formData.value ? encryptedValue : envVar.value, // Only update value if provided
          description: formData.description,
          isSecret: formData.isSecret,
        });
      } else {
        // Create new variable
        const newEnvVar: EnvVariable = {
          id: generateId('env'),
          key: formData.key,
          value: encryptedValue,
          description: formData.description,
          isSecret: formData.isSecret,
          projectId: projectId,
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        localDB.createEnvVariable(newEnvVar);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save environment variable:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Variable Name</label>
        <input
          type="text"
          value={formData.key}
          onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
          placeholder="API_KEY"
          className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
          required
          disabled={isEditing} // Don't allow changing key when editing
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          Value {isEditing && <span className="text-muted-foreground">(leave empty to keep current value)</span>}
        </label>
        <input
          type="text"
          value={formData.value}
          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
          placeholder="Enter the value"
          className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
          required={!isEditing}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description (Optional)</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description"
          className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isSecret"
          checked={formData.isSecret}
          onChange={(e) => setFormData(prev => ({ ...prev, isSecret: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="isSecret" className="text-sm">Mark as secret</label>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {isEditing ? 'Update Variable' : 'Add Variable'}
        </Button>
      </div>
    </form>
  );
}
