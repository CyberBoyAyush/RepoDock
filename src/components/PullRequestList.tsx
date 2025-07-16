// Location: src/components/PullRequestList.tsx
// Description: Pull Request list component for RepoDock.dev - displays pull requests with status indicators, GitHub integration, and modern UI design

'use client';

import { useState, useEffect } from 'react';
import {
  GitPullRequest,
  ExternalLink,
  GitBranch,
  Plus,
  Minus,
  FileText,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  GitMerge
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PullRequest } from '@/types';
import { formatRelativeTime, cn } from '@/lib/utils';
import { GitHubConnectionStatus } from './GitHubConnectionStatus';

interface PullRequestListProps {
  projectId: string;
}

export function PullRequestList({ projectId }: PullRequestListProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [filteredPullRequests, setFilteredPullRequests] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'merged' | 'draft'>('all');

  useEffect(() => {
    fetchPullRequests();
  }, [projectId]);

  useEffect(() => {
    // Filter pull requests based on status
    if (statusFilter === 'all') {
      setFilteredPullRequests(pullRequests);
    } else {
      setFilteredPullRequests(pullRequests.filter(pr => pr.status === statusFilter));
    }
  }, [pullRequests, statusFilter]);

  const fetchPullRequests = async (forceRefresh = false, stateFilter?: 'open' | 'closed' | 'merged' | 'all') => {
    try {
      // Only show loading for force refresh, not initial load from cache
      if (forceRefresh) {
        setIsRefreshing(true);
      }
      setError(null);

      // Build URL with smart parameters
      const params = new URLSearchParams();
      if (forceRefresh) {
        params.set('refresh', 'true');
      }
      if (stateFilter && stateFilter !== 'all') {
        params.set('state', stateFilter);
      }
      // Enable priority fetching by default (open PRs first)
      params.set('priority', 'true');

      const url = `/api/projects/${projectId}/pull-requests${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch pull requests');
      }

      const data = await response.json();
      setPullRequests(data.pullRequests || []);
    } catch (error) {
      console.error('Failed to fetch pull requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to load pull requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: PullRequest['status']) => {
    switch (status) {
      case 'open':
        return <GitPullRequest className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'closed':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'merged':
        return <GitMerge className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      default:
        return <GitPullRequest className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PullRequest['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Open</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      case 'merged':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Merged</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitPullRequest className="w-5 h-5" />
            <span>Pull Requests</span>
          </CardTitle>
          <CardDescription>
            Loading pull requests...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitPullRequest className="w-5 h-5" />
            <span>Pull Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchPullRequests()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <GitHubConnectionStatus />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <GitPullRequest className="w-5 h-5" />
                <span>Pull Requests</span>
              </CardTitle>
              <CardDescription>
                {filteredPullRequests.length} of {pullRequests.length} pull request{pullRequests.length !== 1 ? 's' : ''} shown
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Quick filter buttons */}
              <div className="flex items-center space-x-1 mr-2">
                <Button
                  onClick={() => {
                    setStatusFilter('open');
                    fetchPullRequests(false, 'open');
                  }}
                  variant={statusFilter === 'open' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  Open
                </Button>
                <Button
                  onClick={() => {
                    setStatusFilter('closed');
                    fetchPullRequests(false, 'closed');
                  }}
                  variant={statusFilter === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  Closed
                </Button>
                <Button
                  onClick={() => {
                    setStatusFilter('merged');
                    fetchPullRequests(false, 'merged');
                  }}
                  variant={statusFilter === 'merged' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  Merged
                </Button>
                <Button
                  onClick={() => {
                    setStatusFilter('all');
                    fetchPullRequests(false, 'all');
                  }}
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  All
                </Button>
              </div>
              <Button
                onClick={() => fetchPullRequests(true)}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2 px-6 pb-4">
            {[
              { key: 'all', label: 'All', count: pullRequests.length },
              { key: 'open', label: 'Open', count: pullRequests.filter(pr => pr.status === 'open').length },
              { key: 'closed', label: 'Closed', count: pullRequests.filter(pr => pr.status === 'closed').length },
              { key: 'merged', label: 'Merged', count: pullRequests.filter(pr => pr.status === 'merged').length },
              { key: 'draft', label: 'Draft', count: pullRequests.filter(pr => pr.status === 'draft').length },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={statusFilter === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter.key as any)}
                className="text-xs"
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </CardHeader>
      <CardContent>
        {filteredPullRequests.length === 0 ? (
          <div className="text-center py-8">
            <GitPullRequest className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {pullRequests.length === 0 ? 'No Pull Requests' : `No ${statusFilter === 'all' ? '' : statusFilter} Pull Requests`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {pullRequests.length === 0
                ? 'No pull requests found for this project. Connect a GitHub repository to see pull requests.'
                : `No ${statusFilter === 'all' ? '' : statusFilter} pull requests found. Try a different filter.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPullRequests.map((pr) => (
              <div
                key={pr.id}
                className="group p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 hover:border-border hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {getStatusIcon(pr.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight text-foreground truncate">
                          {pr.title}
                        </h3>
                        {pr.number && (
                          <span className="text-xs text-muted-foreground">#{pr.number}</span>
                        )}
                      </div>

                      {pr.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {pr.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        {pr.author && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{pr.author}</span>
                          </div>
                        )}

                        {pr.sourceBranch && pr.targetBranch && (
                          <div className="flex items-center space-x-1">
                            <GitBranch className="w-3 h-3" />
                            <span>{pr.sourceBranch} → {pr.targetBranch}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatRelativeTime(pr.updatedAt)}</span>
                        </div>
                      </div>

                      {(pr.additions || pr.deletions || pr.changedFiles) && (
                        <div className="flex items-center space-x-3 mt-2 text-xs">
                          {pr.additions && (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <Plus className="w-3 h-3" />
                              <span>{pr.additions}</span>
                            </div>
                          )}
                          {pr.deletions && (
                            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                              <Minus className="w-3 h-3" />
                              <span>{pr.deletions}</span>
                            </div>
                          )}
                          {pr.changedFiles && (
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <FileText className="w-3 h-3" />
                              <span>{pr.changedFiles} file{pr.changedFiles !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusBadge(pr.status)}
                    {pr.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(pr.url, '_blank')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
