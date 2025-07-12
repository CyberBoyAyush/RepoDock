// Location: src/components/GlobalEnv.tsx
// Description: Global environment variables component for RepoDock.dev - manages global environment variables with 256-bit encryption, tree view display, and CRUD operations

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Key, Eye, EyeOff, Copy, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EnvVariableModal } from '@/components/EnvVariableModal';
import { useAuth } from '@/features/auth/useAuth';
import { localDB } from '@/lib/localdb';
import { encryptionService } from '@/lib/encryption';
import { generateId, copyToClipboard, cn } from '@/lib/utils';
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
    if (user) {
      const globalEnvVars = localDB.getGlobalEnvVariables(user.id);
      setEnvVars(globalEnvVars);
    }
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



  return (
    <>
      <div className="space-y-2">
        {/* Key Verification Status */}
        <div className="flex items-center justify-between p-2 rounded-md border border-border/50 bg-card/30">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              keyVerificationStatus === 'verified'
                ? 'bg-green-500'
                : keyVerificationStatus === 'failed'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`} />
            <span className="text-xs font-medium">
              {keyVerificationStatus === 'verified'
                ? 'Encryption Key Verified'
                : keyVerificationStatus === 'failed'
                ? 'Encryption Key Not Set'
                : 'Checking Encryption Key...'}
            </span>
            {keyVerificationStatus === 'verified' && (
              <CheckCircle className="w-3 h-3 text-green-500" />
            )}
            {keyVerificationStatus === 'failed' && (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
          </div>
          {keyVerificationStatus === 'failed' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-red-600 hover:text-red-700"
              onClick={() => {
                // Clear stored password to force re-entry
                if (user) {
                  encryptionService.clearUserEncryptionPassword(user.email);
                  window.location.reload();
                }
              }}
              title="Set up encryption key"
            >
              <Shield className="w-3 h-3 mr-1" />
              Setup
            </Button>
          )}
        </div>

        {/* Enhanced Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
            <span className="text-sm font-semibold text-foreground">
              Global Environment
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0 rounded-lg transition-all duration-200',
              'hover:bg-emerald-500/10 hover:scale-110 active:scale-95',
              'group'
            )}
            onClick={() => setShowCreateModal(true)}
            title="Add Environment Variable"
          >
            <Plus className="w-3.5 h-3.5 group-hover:text-emerald-600 transition-colors" />
          </Button>
        </div>

        {/* Enhanced Environment Variables List */}
        <div className="space-y-2">
          {envVars.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 font-medium">
                No global variables yet
              </p>
              <p className="text-xs text-muted-foreground/80 mb-4 leading-relaxed">
                Add environment variables that can be used across all projects
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className={cn(
                  'h-8 text-xs rounded-lg transition-all duration-200',
                  'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95'
                )}
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Add Variable
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {envVars.map((envVar) => (
                <div
                  key={envVar.id}
                  className={cn(
                    'group relative rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-3 sm:p-4',
                    'hover:border-emerald-200/60 hover:bg-card/80 transition-all duration-200',
                    'hover:shadow-sm hover:shadow-emerald-500/5 cursor-pointer overflow-hidden'
                  )}
                  onClick={() => {
                    setSelectedEnvVar(envVar);
                    setShowDetailsModal(true);
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Key className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-foreground block truncate">
                          {envVar.key}
                        </span>
                      </div>
                    </div>

                    {envVar.isSecret && (
                      <div className="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-md text-xs font-medium flex items-center flex-shrink-0">
                        <Shield className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Value Preview */}
                  <div className="bg-muted/30 rounded-lg p-2 mb-2">
                    <div className="flex items-center justify-between min-w-0">
                      <span className="text-muted-foreground font-mono text-xs truncate flex-1 mr-2">
                        {visibleValues.has(envVar.id)
                          ? getDisplayValue(envVar)
                          : '••••••••••••••••••••'
                        }
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleValueVisibility(envVar);
                          }}
                          className="p-1 hover:bg-emerald-500/10 rounded transition-colors"
                          title={visibleValues.has(envVar.id) ? 'Hide value' : 'Show value'}
                        >
                          {visibleValues.has(envVar.id) ? (
                            <EyeOff className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Eye className="w-3 h-3 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyValue(envVar);
                          }}
                          className="p-1 hover:bg-blue-500/10 rounded transition-colors"
                          title="Copy value"
                        >
                          <Copy className="w-3 h-3 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {envVar.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {envVar.description}
                    </p>
                  )}

                  {/* Click indicator */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
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

        localDB.updateEnvVariable(envVar.id, updates);
      } else {
        // Create new variable
        const encryptedValue = await encryptionService.encryptEnvValueWithUser(formData.value, user.email);

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
