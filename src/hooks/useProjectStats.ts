// Location: src/hooks/useProjectStats.ts
// Description: Custom hook for fetching project statistics (PRs, Issues, Environment Variables) for RepoDock.dev dashboard

import { useState, useEffect } from 'react';

interface ProjectStats {
  pullRequests: {
    total: number;
    open: number;
    closed: number;
    merged: number;
  };
  issues: {
    total: number;
    open: number;
    closed: number;
  };
  envVariables: {
    total: number;
  };
}

interface UseProjectStatsReturn {
  stats: ProjectStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const initialStats: ProjectStats = {
  pullRequests: {
    total: 0,
    open: 0,
    closed: 0,
    merged: 0,
  },
  issues: {
    total: 0,
    open: 0,
    closed: 0,
  },
  envVariables: {
    total: 0,
  },
};

export function useProjectStats(projectId: string | null): UseProjectStatsReturn {
  const [stats, setStats] = useState<ProjectStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!projectId) {
      setStats(initialStats);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [prResponse, issuesResponse, envResponse] = await Promise.allSettled([
        fetch(`/api/projects/${projectId}/pull-requests`),
        fetch(`/api/projects/${projectId}/issues`),
        fetch(`/api/env-variables?projectId=${projectId}`),
      ]);

      const newStats: ProjectStats = { ...initialStats };

      // Process Pull Requests
      if (prResponse.status === 'fulfilled' && prResponse.value.ok) {
        try {
          const prData = await prResponse.value.json();
          const pullRequests = prData.pullRequests || [];
          
          newStats.pullRequests.total = pullRequests.length;
          newStats.pullRequests.open = pullRequests.filter((pr: any) => pr.status === 'open').length;
          newStats.pullRequests.closed = pullRequests.filter((pr: any) => pr.status === 'closed').length;
          newStats.pullRequests.merged = pullRequests.filter((pr: any) => pr.status === 'merged').length;
        } catch (e) {
          // Silent error for PR data
        }
      }

      // Process Issues
      if (issuesResponse.status === 'fulfilled' && issuesResponse.value.ok) {
        try {
          const issuesData = await issuesResponse.value.json();
          const issues = issuesData.issues || [];
          
          newStats.issues.total = issues.length;
          newStats.issues.open = issues.filter((issue: any) => issue.status === 'open').length;
          newStats.issues.closed = issues.filter((issue: any) => issue.status === 'closed').length;
        } catch (e) {
          // Silent error for issues data
        }
      }

      // Process Environment Variables
      if (envResponse.status === 'fulfilled' && envResponse.value.ok) {
        try {
          const envData = await envResponse.value.json();
          const envVariables = envData.envVariables || [];
          
          newStats.envVariables.total = envVariables.length;
        } catch (e) {
          // Silent error for env vars data
        }
      }

      setStats(newStats);
    } catch (error) {
      setError('Failed to load project statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [projectId]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
