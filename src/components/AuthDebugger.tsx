// Location: src/components/AuthDebugger.tsx
// Description: Debug component to help troubleshoot authentication issues

'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';

export function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { user, isAuthenticated, validateSession } = useAuth();

  const checkAuthStatus = async () => {
    setIsChecking(true);
    try {
      // Check session via auth client
      const sessionResult = await authClient.getSession();
      
      // Check session via auth store
      const storeValidation = await validateSession();
      
      // Check cookies
      const cookies = document.cookie;
      const authCookies = cookies.split(';').filter(cookie => 
        cookie.trim().includes('better-auth') || 
        cookie.trim().includes('session') ||
        cookie.trim().includes('auth')
      );

      setDebugInfo({
        timestamp: new Date().toISOString(),
        authClient: {
          hasData: !!sessionResult.data,
          hasUser: !!sessionResult.data?.user,
          hasError: !!sessionResult.error,
          errorMessage: sessionResult.error?.message,
          userData: sessionResult.data?.user ? {
            id: sessionResult.data.user.id,
            email: sessionResult.data.user.email,
            name: sessionResult.data.user.name
          } : null
        },
        authStore: {
          user: user ? {
            id: user.id,
            email: user.email,
            name: user.name
          } : null,
          isAuthenticated,
          storeValidation
        },
        cookies: {
          authCookies,
          totalCookies: cookies.split(';').length
        },
        browser: {
          userAgent: navigator.userAgent,
          localStorage: {
            hasAuthData: !!localStorage.getItem('auth'),
            keys: Object.keys(localStorage).filter(key => 
              key.includes('auth') || key.includes('user')
            )
          }
        }
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    setIsChecking(false);
  };

  return (
    <div className="p-6 bg-card border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Authentication Debugger</h3>
        <Button 
          onClick={checkAuthStatus} 
          loading={isChecking}
          variant="outline"
          size="sm"
        >
          Check Auth Status
        </Button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current State</h4>
            <div className="text-sm space-y-1">
              <p><strong>Store Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>Store User:</strong> {user ? `${user.name} (${user.email})` : 'None'}</p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Debug Information</h4>
            <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
