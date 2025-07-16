// Location: src/components/RepositoryConnection.tsx
// Description: Repository connection component for RepoDock.dev - handles GitHub repository connection and management for projects

'use client';

import { useState, useEffect } from 'react';
import {
  GitBranch,
  Link,
  Unlink,
  ExternalLink,
  Search,
  Check,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Project, GitHubRepository } from '@/types';
import { parseRepositoryIdentifier, formatRepositoryUrl } from '@/lib/github-app';

interface RepositoryConnectionProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function RepositoryConnection({ project, onUpdate }: RepositoryConnectionProps) {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualRepoUrl, setManualRepoUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!project.repository;
  const repoInfo = project.repository ? parseRepositoryIdentifier(project.repository) : null;

  useEffect(() => {
    if (showConnectionModal) {
      fetchUserRepositories();
    }
  }, [showConnectionModal]);

  const fetchUserRepositories = async () => {
    setIsLoadingRepos(true);
    setError(null);
    
    try {
      // This would call a new API endpoint to get user's GitHub repositories
      const response = await fetch('/api/github/repositories');
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      setError('Failed to load repositories. Make sure your GitHub account is connected.');
      setRepositories([]);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const connectRepository = async (repository: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const repoInfo = parseRepositoryIdentifier(repository);
      if (!repoInfo) {
        throw new Error('Invalid repository format');
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository,
          githubOwner: repoInfo.owner,
          githubRepo: repoInfo.repo,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect repository');
      }

      onUpdate({
        repository,
        githubOwner: repoInfo.owner,
        githubRepo: repoInfo.repo,
        githubRepoId: undefined, // Will be set when we fetch repo details
      });

      setShowConnectionModal(false);
      setManualRepoUrl('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectRepository = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Call the disconnect endpoint that will clean up all related data
      const response = await fetch(`/api/projects/${project.id}/disconnect-repository`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to disconnect repository');
      }

      onUpdate({
        repository: undefined,
        githubOwner: undefined,
        githubRepo: undefined,
        githubRepoId: undefined,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disconnect repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5" />
            <span>GitHub Repository</span>
          </CardTitle>
          <CardDescription>
            Connect your project to a GitHub repository to sync issues and pull requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
                    <GitBranch className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Connected to {repoInfo?.owner}/{repoInfo?.repo}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Issues and pull requests will be synced automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (project.repository) {
                        window.open(formatRepositoryUrl(project.repository), '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(true)}
                    disabled={isConnecting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4 mr-2" />
                    )}
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Repository Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect a GitHub repository to enable issue and pull request synchronization.
              </p>
              <Button onClick={() => setShowConnectionModal(true)}>
                <Link className="w-4 h-4 mr-2" />
                Connect Repository
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Repository Connection Modal */}
      <Modal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        title="Connect GitHub Repository"
        size="2xl"
      >
        <div className="space-y-4 flex flex-col min-h-0">
          {/* Manual Repository URL Input */}
          <div className="space-y-3 flex-shrink-0">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Repository URL or Owner/Repo
              </label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={manualRepoUrl}
                  onChange={(e) => setManualRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1"
                />
                <Button
                  onClick={() => connectRepository(manualRepoUrl)}
                  disabled={!manualRepoUrl.trim() || isConnecting}
                  className="px-3"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  OR CHOOSE FROM YOUR REPOSITORIES
                </span>
              </div>
            </div>
          </div>

          {/* Repository Search and List */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3">
            {/* Search Input */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories..."
                className="pl-10"
              />
            </div>

            {/* Repository List Container */}
            <div className="h-64 border border-border rounded-lg overflow-hidden">
              {isLoadingRepos ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Loading repositories...</p>
                  </div>
                </div>
              ) : filteredRepositories.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <GitBranch className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {repositories.length === 0
                        ? 'No repositories found'
                        : 'No repositories match your search'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto h-full">
                  {filteredRepositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => connectRepository(repo.full_name)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-foreground truncate">
                              {repo.full_name}
                            </p>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                Private
                              </Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        title="Disconnect Repository"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-2">
                Are you sure you want to disconnect this repository?
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>This action will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Remove the connection to <strong>{repoInfo?.owner}/{repoInfo?.repo}</strong></li>
                  <li>Delete all synced GitHub issues and pull requests</li>
                  <li>Keep your local tasks and environment variables</li>
                </ul>
                <p className="text-destructive font-medium mt-3">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectConfirm(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                disconnectRepository();
                setShowDisconnectConfirm(false);
              }}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Disconnect & Delete Data
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
