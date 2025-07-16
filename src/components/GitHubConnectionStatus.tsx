// Location: src/components/GitHubConnectionStatus.tsx
// Description: GitHub connection status component for RepoDock.dev - shows GitHub OAuth status and provides login option

'use client';

import { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface GitHubConnectionStatusProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function GitHubConnectionStatus({ onConnectionChange }: GitHubConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkGitHubConnection();
  }, []);

  const checkGitHubConnection = async () => {
    try {
      setIsLoading(true);

      // Check if current user has GitHub App installed
      const response = await fetch('/api/github/user-installation');
      const data = await response.json();
      const connected = response.ok && data.hasInstallation;

      setIsConnected(connected);
      onConnectionChange?.(connected);
    } catch (error) {
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSetup = () => {
    // Open GitHub App installation page
    const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'repodock';
    const installUrl = `https://github.com/apps/${appName}/installations/new`;
    window.open(installUrl, '_blank');
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/github/user-installation', {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsConnected(false);
        onConnectionChange?.(false);
        // Optionally refresh the page or show a success message
        window.location.reload();
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">Checking GitHub connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected === false) {
    return (
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-orange-900 dark:text-orange-100">
            <AlertCircle className="w-5 h-5" />
            <span>GitHub App Not Installed</span>
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            Install the RepoDock GitHub App to sync pull requests and issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGitHubSetup}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Install GitHub App
            </Button>
            <Button
              variant="outline"
              onClick={checkGitHubConnection}
              className="border-orange-200 dark:border-orange-800"
            >
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
            <GitBranch className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              GitHub App Installed
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Pull requests and issues will sync automatically
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkGitHubConnection}
            className="border-green-200 dark:border-green-800"
          >
            Refresh
          </Button>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
          >
            <Unlink className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
