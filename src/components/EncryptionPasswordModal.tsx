// Location: src/components/EncryptionPasswordModal.tsx
// Description: Modal for entering encryption password with security notice

'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface EncryptionPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  userEmail: string;
}

export function EncryptionPasswordModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userEmail 
}: EncryptionPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      onSubmit(password);
      setPassword('');
      onClose();
    } catch (error) {
      console.error('Error submitting password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enter Encryption Password"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header with icon */}
        <div className="flex items-center space-x-3 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Encryption Password Required</h3>
            <p className="text-sm text-muted-foreground">
              Enter your password to decrypt environment variables
            </p>
          </div>
        </div>

        {/* User info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Account:</span>
            <span className="text-sm font-medium">{userEmail}</span>
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Encryption Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your encryption password"
              className="w-full px-3 py-2 pr-10 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Security Notice
              </h4>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p>• We <strong>do not store</strong> encryption passwords on servers</p>
                <p>• Your password is stored in your local browser only</p>
                <p>• <strong>Do not forget it</strong> - lost passwords cannot be recovered</p>
                <p>• Use the same password on all devices for cross-device access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning for password loss */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              <strong>Important:</strong> If you forget this password, your encrypted data cannot be recovered.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!password.trim() || isLoading}
          >
            <Key className="w-4 h-4 mr-2" />
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Global state management for the modal
let globalModalState: {
  isOpen: boolean;
  userEmail: string;
  resolve?: (password: string) => void;
  reject?: () => void;
} = {
  isOpen: false,
  userEmail: '',
};

let setModalState: ((state: typeof globalModalState) => void) | null = null;

// Hook to manage the modal state
export function useEncryptionPasswordModal() {
  const [modalState, setModalStateInternal] = useState(globalModalState);

  // Register the state setter globally
  if (!setModalState) {
    setModalState = setModalStateInternal;
  }

  const showModal = (userEmail: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const newState = {
        isOpen: true,
        userEmail,
        resolve,
        reject,
      };
      globalModalState = newState;
      if (setModalState) {
        setModalState(newState);
      }
    });
  };

  const handleSubmit = (password: string) => {
    if (modalState.resolve) {
      modalState.resolve(password);
    }
    closeModal();
  };

  const closeModal = () => {
    if (modalState.reject) {
      modalState.reject();
    }
    const newState = {
      isOpen: false,
      userEmail: '',
    };
    globalModalState = newState;
    if (setModalState) {
      setModalState(newState);
    }
  };

  return {
    modalState,
    showModal,
    handleSubmit,
    closeModal,
  };
}

// Global function to show the modal
export const showEncryptionPasswordModal = (userEmail: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const newState = {
      isOpen: true,
      userEmail,
      resolve,
      reject,
    };
    globalModalState = newState;
    if (setModalState) {
      setModalState(newState);
    }
  });
};
