// Location: src/components/ui/Toast.tsx
// Description: Toast notification component for RepoDock.dev - provides user feedback for actions and errors

'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950/80 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950/80 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/80 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/80 dark:border-blue-800';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg shadow-lg transition-all duration-300 transform',
        getBackgroundColor(),
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-foreground">
              {title}
            </h3>
            {message && (
              <p className="mt-1 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Expose addToast globally
  useEffect(() => {
    (window as any).showToast = addToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  );
}

// Helper function to show toasts
export const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast(toast);
  }
};

// Convenience functions
export const showSuccessToast = (title: string, message?: string) => {
  showToast({ type: 'success', title, message });
};

export const showErrorToast = (title: string, message?: string) => {
  showToast({ type: 'error', title, message });
};

export const showWarningToast = (title: string, message?: string) => {
  showToast({ type: 'warning', title, message });
};

export const showInfoToast = (title: string, message?: string) => {
  showToast({ type: 'info', title, message });
};
