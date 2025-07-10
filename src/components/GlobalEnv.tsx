// Location: src/components/GlobalEnv.tsx
// Description: Global environment variables component for RepoDock.dev - manages global environment variables with 256-bit encryption, tree view display, and CRUD operations

'use client';

import * as React from 'react';
import { useState } from 'react';
import { Plus, Key, Eye, EyeOff, Copy, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/useAuth';
import { localDB } from '@/lib/localdb';
import { encryptionService } from '@/lib/encryption';
import { generateId, copyToClipboard } from '@/lib/utils';
import { EnvVariable } from '@/types';

export function GlobalEnv() {
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [editingVar, setEditingVar] = useState<EnvVariable | null>(null);
  const { user } = useAuth();

  // Load environment variables
  React.useEffect(() => {
    if (user) {
      const globalEnvVars = localDB.getGlobalEnvVariables(user.id);
      setEnvVars(globalEnvVars);
    }
  }, [user]);

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
      console.log('Attempting to decrypt env var:', { id: envVar.id, key: envVar.key, hasValue: !!envVar.value });
      const decrypted = encryptionService.decryptEnvValue(envVar.value, user.id);
      console.log('Decryption successful for:', envVar.key);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed for env var:', envVar.key, error);
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

  const testEncryption = () => {
    if (user) {
      console.log('Testing encryption for user:', user.id);
      const result = encryptionService.testEncryption(user.id);
      alert(`Encryption test ${result ? 'PASSED' : 'FAILED'}. Check console for details.`);
    }
  };

  const clearEncryptionData = () => {
    if (user && confirm('This will clear all environment variables and encryption keys. Continue?')) {
      // Clear master key
      encryptionService.clearMasterKey(user.id);
      // Clear env variables
      localStorage.removeItem('repodock_env_variables');
      // Reload the component
      setEnvVars([]);
      alert('Encryption data cleared. You can now create new environment variables.');
    }
  };

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Global Environment
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={testEncryption}
              title="Test Encryption"
            >
              🔧
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={clearEncryptionData}
              title="Clear All Data"
            >
              🗑️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowCreateModal(true)}
              title="Add Environment Variable"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Environment Variables List */}
        <div className="space-y-1">
          {envVars.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <Key className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-2">
                No global environment variables
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="h-6 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Variable
              </Button>
            </div>
          ) : (
            envVars.map((envVar) => (
              <div
                key={envVar.id}
                className="group p-3 rounded-md border border-border/50 hover:border-border transition-colors bg-card/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Key className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-xs font-semibold truncate">
                      {envVar.key}
                    </span>
                    {envVar.isSecret && (
                      <div className="px-1 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs font-medium">
                        Secret
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleValueVisibility(envVar.id)}
                      title={visibleValues.has(envVar.id) ? 'Hide value' : 'Show value'}
                    >
                      {visibleValues.has(envVar.id) ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopyValue(envVar)}
                      title="Copy value"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleEditEnvVar(envVar)}
                      title="Edit variable"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteEnvVar(envVar.id)}
                      title="Delete variable"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded p-2 mb-2">
                  <div className="text-xs">
                    {visibleValues.has(envVar.id) ? (
                      <code className="bg-background px-1 py-0.5 rounded text-xs break-all font-mono">
                        {getDecryptedValue(envVar)}
                      </code>
                    ) : (
                      <span className="text-muted-foreground font-mono">••••••••••••••••</span>
                    )}
                  </div>
                </div>

                {envVar.description && (
                  <div className="text-xs text-muted-foreground italic">
                    {envVar.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title={editingVar ? "Edit Global Environment Variable" : "Add Global Environment Variable"}
        size="md"
      >
        <EnvVariableForm
          envVar={editingVar}
          onSuccess={() => {
            handleModalClose();
            // Reload env vars
            if (user) {
              const globalEnvVars = localDB.getGlobalEnvVariables(user.id);
              setEnvVars(globalEnvVars);
            }
          }}
          onCancel={handleModalClose}
          isGlobal={true}
        />
      </Modal>
    </>
  );
}

// Simple form component for environment variables
function EnvVariableForm({
  envVar,
  onSuccess,
  onCancel,
  isGlobal = false
}: {
  envVar?: EnvVariable | null;
  onSuccess: () => void;
  onCancel: () => void;
  isGlobal?: boolean;
}) {
  const [formData, setFormData] = useState({
    key: envVar?.key || '',
    value: '',
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
      if (isEditing && envVar) {
        // Update existing variable
        const updates: Partial<EnvVariable> = {
          key: formData.key,
          description: formData.description,
          isSecret: formData.isSecret,
        };

        // Only update value if provided
        if (formData.value) {
          updates.value = encryptionService.encryptEnvValue(formData.value, user.id);
        }

        localDB.updateEnvVariable(envVar.id, updates);
      } else {
        // Create new variable
        const encryptedValue = encryptionService.encryptEnvValue(formData.value, user.id);

        const newEnvVar: EnvVariable = {
          id: generateId('env'),
          key: formData.key,
          value: encryptedValue,
          description: formData.description,
          isSecret: formData.isSecret,
          projectId: isGlobal ? undefined : undefined,
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
        />
      </div>

      <div>
        <label className="text-sm font-medium">Value</label>
        <input
          type="text"
          value={formData.value}
          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
          placeholder={isEditing ? "Leave empty to keep current value" : "Enter the value"}
          className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
          required={!isEditing}
        />
        {isEditing && (
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty to keep the current encrypted value
          </p>
        )}
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
