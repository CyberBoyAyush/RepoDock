// Location: src/components/EnvVariableModal.tsx
// Description: Beautiful modal for viewing and managing environment variable details with modern UI and responsive design

'use client';

import { useState, useEffect } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash2, 
  Shield, 
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn, copyToClipboard } from '@/lib/utils';
import { EnvVariable } from '@/types';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';

interface EnvVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  envVar: EnvVariable | null;
  decryptedValue?: string;
  onToggleVisibility: (envVar: EnvVariable) => void;
  onEdit: (envVar: EnvVariable) => void;
  onDelete: (envVarId: string) => void;
  onDecrypt: (envVar: EnvVariable) => Promise<string>;
  isVisible: boolean;
}

export function EnvVariableModal({
  isOpen,
  onClose,
  envVar,
  decryptedValue,
  onToggleVisibility,
  onEdit,
  onDelete,
  onDecrypt,
  isVisible
}: EnvVariableModalProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  if (!envVar) return null;

  const handleCopyValue = async () => {
    try {
      let valueToCopy = decryptedValue;
      
      if (!valueToCopy && !isVisible) {
        setIsDecrypting(true);
        valueToCopy = await onDecrypt(envVar);
        setIsDecrypting(false);
      }

      if (valueToCopy) {
        const success = await copyToClipboard(valueToCopy);
        if (success) {
          setCopySuccess(true);
          showSuccessToast('Copied!', 'Environment variable value copied to clipboard');
        } else {
          showErrorToast('Copy Failed', 'Failed to copy value to clipboard');
        }
      }
    } catch (error) {
      setIsDecrypting(false);
      showErrorToast('Decryption Failed', 'Could not decrypt the environment variable');
    }
  };

  const handleToggleVisibility = async () => {
    if (!isVisible && !decryptedValue) {
      setIsDecrypting(true);
      try {
        await onDecrypt(envVar);
      } catch (error) {
        showErrorToast('Decryption Failed', 'Could not decrypt the environment variable');
      }
      setIsDecrypting(false);
    }
    onToggleVisibility(envVar);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="max-w-2xl modal-responsive"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20',
              'border border-emerald-200/30 dark:border-emerald-800/30'
            )}>
              <Key className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {envVar.key}
              </h2>
              <div className="flex items-center space-x-3">
                {envVar.isSecret && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    <span>Secret</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span>Global</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {envVar.description && (
          <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
            <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {envVar.description}
            </p>
          </div>
        )}

        {/* Value Section */}
        <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Value</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleVisibility}
                disabled={isDecrypting}
                className={cn(
                  'h-8 px-3 rounded-lg transition-all duration-200',
                  'hover:bg-emerald-500/10 hover:scale-105 active:scale-95'
                )}
              >
                {isDecrypting ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                ) : isVisible ? (
                  <EyeOff className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Eye className="w-4 h-4 text-emerald-600" />
                )}
                <span className="ml-2 text-xs">
                  {isDecrypting ? 'Decrypting...' : isVisible ? 'Hide' : 'Show'}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyValue}
                disabled={isDecrypting}
                className={cn(
                  'h-8 px-3 rounded-lg transition-all duration-200',
                  'hover:bg-blue-500/10 hover:scale-105 active:scale-95',
                  copySuccess && 'bg-green-500/10 text-green-600'
                )}
              >
                {copySuccess ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-blue-600" />
                )}
                <span className="ml-2 text-xs">
                  {copySuccess ? 'Copied!' : 'Copy'}
                </span>
              </Button>
            </div>
          </div>
          
          <div className={cn(
            'bg-background/80 rounded-lg p-4 border border-border/30',
            'transition-all duration-200 min-h-[60px] flex items-center'
          )}>
            {isVisible && decryptedValue ? (
              <code className="text-sm font-mono break-all text-foreground leading-relaxed w-full">
                {decryptedValue}
              </code>
            ) : (
              <span className="text-muted-foreground font-mono text-lg tracking-wider">
                ••••••••••••••••••••••••
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Created</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(envVar.createdAt)}
            </p>
          </div>
          
          <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Updated</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(envVar.updatedAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(envVar)}
              className={cn(
                'h-9 px-4 rounded-lg transition-all duration-200',
                'hover:bg-orange-500/10 hover:border-orange-500/30 hover:scale-105 active:scale-95'
              )}
            >
              <Edit className="w-4 h-4 mr-2 text-orange-600" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(envVar.id)}
              className={cn(
                'h-9 px-4 rounded-lg transition-all duration-200',
                'hover:bg-red-500/10 hover:border-red-500/30 hover:scale-105 active:scale-95',
                'text-red-600 border-red-200 dark:border-red-800'
              )}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 px-4 rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
