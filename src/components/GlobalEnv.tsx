// Location: src/components/GlobalEnv.tsx
// Description: Global environment variables component for RepoDock.dev - manages global environment variables with 256-bit encryption, tree view display, and CRUD operations

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Key, Eye, EyeOff, Copy, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EnvVariableModal } from '@/components/EnvVariableModal';
import { useAuth } from '@/features/auth/useAuth';

import { encryptionService } from '@/lib/encryption';
import { copyToClipboard, cn } from '@/lib/utils';
import { EnvVariable } from '@/types';
import { showErrorToast } from '@/components/ui/Toast';

export function GlobalEnv() {
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [editingVar, setEditingVar] = useState<EnvVariable | null>(null);
  const [keyVerificationStatus, setKeyVerificationStatus] = useState<'unknown' | 'verified' | 'failed'>('unknown');
  const [selectedEnvVar, setSelectedEnvVar] = useState<EnvVariable | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { user } = useAuth();

  // Load environment variables
  React.useEffect(() => {
    const loadEnvVars = async () => {
      if (user) {
        try {
          const response = await fetch('/api/env-variables');
          if (response.ok) {
            const { envVariables } = await response.json();
            setEnvVars(envVariables);
          }
        } catch (error) {
          console.error('Failed to load environment variables:', error);
        }
      }
    };

    loadEnvVars();
  }, [user]);

  const toggleValueVisibility = async (envVar: EnvVariable) => {
    setVisibleValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(envVar.id)) {
        newSet.delete(envVar.id);
      } else {
        newSet.add(envVar.id);
        // Decrypt the value when showing it
        if (!decryptedValues[envVar.id]) {
          getDecryptedValue(envVar);
        }
      }
      return newSet;
    });
  };

  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [decryptionErrorShown, setDecryptionErrorShown] = useState(false);

  // Check key verification status
  useEffect(() => {
    const checkKeyVerification = async () => {
      if (!user) {
        setKeyVerificationStatus('unknown');
        return;
      }

      try {
        const storageKey = `repodock_encryption_password_${user.email}`;
        const hasStoredPassword = localStorage.getItem(storageKey);

        if (!hasStoredPassword) {
          setKeyVerificationStatus('failed');
          return;
        }

        // Test encryption/decryption to verify key works
        const testValue = 'test-key-verification';
        const encrypted = await encryptionService.encryptEnvValueWithUser(testValue, user.email);
        const decrypted = await encryptionService.decryptEnvValueWithUser(encrypted, user.email);

        if (decrypted === testValue) {
          setKeyVerificationStatus('verified');
        } else {
          setKeyVerificationStatus('failed');
        }
      } catch (error) {
        console.error('Key verification failed:', error);
        setKeyVerificationStatus('failed');
      }
    };

    checkKeyVerification();
  }, [user]);

  const getDecryptedValue = async (envVar: EnvVariable): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Attempting to decrypt env var:', { id: envVar.id, key: envVar.key, hasValue: !!envVar.value });
      const decrypted = await encryptionService.decryptEnvValueWithUser(envVar.value, user.email);
      console.log('Decryption successful for:', envVar.key);
      setDecryptedValues(prev => ({ ...prev, [envVar.id]: decrypted }));
      // Reset error flag on successful decryption
      setDecryptionErrorShown(false);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed for env var:', envVar.key, error);
      const errorMessage = '[DECRYPTION_FAILED]';
      setDecryptedValues(prev => ({ ...prev, [envVar.id]: errorMessage }));

      // Show error toast only once per session
      if (!decryptionErrorShown) {
        setDecryptionErrorShown(true);
        showErrorToast(
          'Decryption Failed',
          'Wrong encryption password or corrupted data. Please check your encryption password in Settings.'
        );
      }
      throw error;
    }
  };

  const getDisplayValue = (envVar: EnvVariable): string => {
    if (visibleValues.has(envVar.id)) {
      return decryptedValues[envVar.id] || 'Decrypting...';
    }
    return '••••••••';
  };

  const handleCopyValue = async (envVar: EnvVariable) => {
    const decryptedValue = decryptedValues[envVar.id];
    if (!decryptedValue) {
      await getDecryptedValue(envVar);
      return;
    }

    const success = await copyToClipboard(decryptedValue);

    if (success) {
      // You could add a toast notification here
      console.log('Value copied to clipboard');
    }
  };

  const handleDeleteEnvVar = async (id: string) => {
    if (confirm('Are you sure you want to delete this environment variable?')) {
      try {
        const response = await fetch(`/api/env-variables/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setEnvVars(prev => prev.filter(env => env.id !== id));
        }
      } catch (error) {
        console.error('Failed to delete environment variable:', error);
      }
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



  return (
    <>
      <div className="space-y-2">
        {/* Minimal Key Verification Status */}
        <div className="flex items-center justify-between p-2 rounded border border-border/20 bg-muted/30">
          <div className="flex items-center space-x-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              keyVerificationStatus === 'verified'
                ? 'bg-green-500'
                : keyVerificationStatus === 'failed'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`} />
            <span className="text-xs">
              {keyVerificationStatus === 'verified'
                ? 'Key verified'
                : keyVerificationStatus === 'failed'
                ? 'Key not set'
                : 'Checking...'}
            </span>
          </div>
          {keyVerificationStatus === 'failed' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs text-red-600 hover:text-red-700 px-1"
              onClick={() => {
                // Clear stored password to force re-entry
                if (user) {
                  encryptionService.clearUserEncryptionPassword(user.email);
                  window.location.reload();
                }
              }}
              title="Set up encryption key"
            >
              Setup
            </Button>
          )}
        </div>

        {/* Minimal Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Global Environment
          </span>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 w-6 p-0 rounded transition-colors duration-150',
              'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setShowCreateModal(true)}
            title="Add Environment Variable"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Minimal Environment Variables List */}
        <div className="space-y-1.5">
          {envVars.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                <Key className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                No global variables yet
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="h-7 text-xs rounded"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Variable
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {envVars.map((envVar) => (
                <div
                  key={envVar.id}
                  className={cn(
                    'group relative rounded-lg border border-border/30 p-2.5',
                    'hover:border-border/50 hover:bg-accent/30 transition-colors duration-150',
                    'shadow-sm shadow-black/5 dark:shadow-none hover:shadow-md dark:hover:shadow-none',
                    'cursor-pointer'
                  )}
                  onClick={() => {
                    setSelectedEnvVar(envVar);
                    setShowDetailsModal(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="w-4 h-4 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <Key className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-medium text-foreground truncate">
                            {envVar.key}
                          </span>
                          {envVar.isSecret && (
                            <Shield className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                            {visibleValues.has(envVar.id)
                              ? getDisplayValue(envVar)
                              : '••••••••'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleValueVisibility(envVar);
                        }}
                        className="p-1 hover:bg-accent rounded transition-colors"
                        title={visibleValues.has(envVar.id) ? 'Hide value' : 'Show value'}
                      >
                        {visibleValues.has(envVar.id) ? (
                          <EyeOff className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyValue(envVar);
                        }}
                        className="p-1 hover:bg-accent rounded transition-colors"
                        title="Copy value"
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title={editingVar ? "Edit Global Environment Variable" : "Add Global Environment Variable"}
        size="md"
      >
        <EnvVariableForm
          envVar={editingVar}
          onSuccess={async () => {
            handleModalClose();
            // Reload env vars
            if (user) {
              try {
                const response = await fetch('/api/env-variables');
                if (response.ok) {
                  const { envVariables } = await response.json();
                  setEnvVars(envVariables);
                }
              } catch (error) {
                console.error('Failed to reload environment variables:', error);
              }
            }
          }}
          onCancel={handleModalClose}
          isGlobal={true}
        />
      </Modal>

      {/* Details Modal */}
      <EnvVariableModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEnvVar(null);
        }}
        envVar={selectedEnvVar}
        decryptedValue={selectedEnvVar ? decryptedValues[selectedEnvVar.id] : undefined}
        onToggleVisibility={toggleValueVisibility}
        onEdit={(envVar) => {
          setShowDetailsModal(false);
          handleEditEnvVar(envVar);
        }}
        onDelete={(envVarId) => {
          setShowDetailsModal(false);
          handleDeleteEnvVar(envVarId);
        }}
        onDecrypt={getDecryptedValue}
        isVisible={selectedEnvVar ? visibleValues.has(selectedEnvVar.id) : false}
      />
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
          updates.value = await encryptionService.encryptEnvValueWithUser(formData.value, user.email);
        }

        const response = await fetch(`/api/env-variables/${envVar.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update environment variable');
        }
      } else {
        // Create new variable
        const encryptedValue = await encryptionService.encryptEnvValueWithUser(formData.value, user.email);

        const newEnvVarData = {
          key: formData.key,
          value: encryptedValue,
          description: formData.description,
          isSecret: formData.isSecret,
          projectId: isGlobal ? undefined : undefined,
        };

        const response = await fetch('/api/env-variables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEnvVarData),
        });

        if (!response.ok) {
          throw new Error('Failed to create environment variable');
        }
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
