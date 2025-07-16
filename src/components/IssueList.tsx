// Location: src/components/IssueList.tsx
// Description: Issue list component for RepoDock.dev - displays issues with status indicators, priority badges, GitHub integration, and create issue functionality

'use client';

import { useState, useEffect } from 'react';
import {
  Bug,
  Plus,
  ExternalLink,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Issue } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { IssueForm } from './IssueForm';
import { GitHubConnectionStatus } from './GitHubConnectionStatus';

interface IssueListProps {
  projectId: string;
}

export function IssueList({ projectId }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');

  useEffect(() => {
    fetchIssues();
  }, [projectId]);

  useEffect(() => {
    // Filter issues based on status and priority
    let filtered = issues;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

    setFilteredIssues(filtered);
  }, [issues, statusFilter, priorityFilter]);

  const fetchIssues = async (forceRefresh = false, stateFilter?: 'open' | 'closed' | 'all') => {
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
      // Enable priority fetching by default (open issues first)
      params.set('priority', 'true');

      const url = `/api/projects/${projectId}/issues${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch issues');
      }

      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      setError(error instanceof Error ? error.message : 'Failed to load issues');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getTypeIcon = (type: Issue['type']) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'enhancement':
        return <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'documentation':
        return <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusIcon = (status: Issue['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: Issue['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: Issue['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Open</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchIssues(); // Refresh the list
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="w-5 h-5" />
            <span>Issues</span>
          </CardTitle>
          <CardDescription>
            Loading issues...
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
            <Bug className="w-5 h-5" />
            <span>Issues</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchIssues()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <GitHubConnectionStatus />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bug className="w-5 h-5" />
                <span>Issues</span>
              </CardTitle>
              <CardDescription>
                {filteredIssues.length} of {issues.length} issue{issues.length !== 1 ? 's' : ''} shown
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Quick filter buttons */}
              <div className="flex items-center space-x-1 mr-2">
                <Button
                  onClick={() => {
                    setStatusFilter('open');
                    fetchIssues(false, 'open');
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
                    fetchIssues(false, 'closed');
                  }}
                  variant={statusFilter === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  Closed
                </Button>
                <Button
                  onClick={() => {
                    setStatusFilter('all');
                    fetchIssues(false, 'all');
                  }}
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  All
                </Button>
              </div>
              <Button
                onClick={() => fetchIssues(true)}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Issue
              </Button>
            </div>
          </div>

          {/* Status and Priority Filters */}
          <div className="px-6 pb-4 space-y-3">
            {/* Status Filter */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: issues.length },
                  { key: 'open', label: 'Open', count: issues.filter(issue => issue.status === 'open').length },
                  { key: 'closed', label: 'Closed', count: issues.filter(issue => issue.status === 'closed').length },
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
            </div>

            {/* Priority Filter */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Priority</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: issues.length },
                  { key: 'urgent', label: 'Urgent', count: issues.filter(issue => issue.priority === 'urgent').length },
                  { key: 'high', label: 'High', count: issues.filter(issue => issue.priority === 'high').length },
                  { key: 'medium', label: 'Medium', count: issues.filter(issue => issue.priority === 'medium').length },
                  { key: 'low', label: 'Low', count: issues.filter(issue => issue.priority === 'low').length },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={priorityFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPriorityFilter(filter.key as any)}
                    className="text-xs"
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <div className="text-center py-8">
              <Bug className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {issues.length === 0 ? 'No Issues' : 'No Matching Issues'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {issues.length === 0
                  ? 'No issues found for this project. Create your first issue to get started.'
                  : 'No issues match the current filters. Try adjusting your filter criteria.'
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Issue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="group p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 hover:border-border hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(issue.status)}
                        {getTypeIcon(issue.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-sm leading-tight text-foreground truncate">
                            {issue.title}
                          </h3>
                          {issue.number && (
                            <span className="text-xs text-muted-foreground">#{issue.number}</span>
                          )}
                        </div>

                        {issue.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {issue.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {issue.author && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{issue.author}</span>
                            </div>
                          )}

                          {issue.comments && issue.comments > 0 && (
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{issue.comments}</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatRelativeTime(issue.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {getPriorityBadge(issue.priority)}
                      {getStatusBadge(issue.status)}
                      {issue.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(issue.url, '_blank')}
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

      {/* Create Issue Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Issue"
        size="lg"
      >
        <IssueForm
          projectId={projectId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  );
}
