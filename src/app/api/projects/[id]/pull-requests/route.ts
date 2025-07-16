import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseRepositoryIdentifier } from '@/lib/github-app';
import { getGitHubServiceForCurrentUser } from '@/lib/github-user-service';
import { generateId } from '@/lib/utils';
import { PullRequest } from '@/types';

// GET /api/projects/[id]/pull-requests - Get pull requests for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get project to verify ownership and get repository info
    const project = await database.getProject(projectId);
    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get current user info to get GitHub username
    const user = await database.getUser(session.user.id);
    if (!user?.githubUsername) {
      return NextResponse.json({ error: 'GitHub username not found. Please connect your GitHub account.' }, { status: 400 });
    }

    // Get local pull requests from database
    const allLocalPRs = await database.getPullRequests(projectId);

    // Filter PRs to only include those authored by, assigned to, or requested for review by the current user
    const localPullRequests = filterUserPullRequests(allLocalPRs, user.githubUsername);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const stateFilter = searchParams.get('state') as 'open' | 'closed' | 'all' || 'all';
    const priorityFetch = searchParams.get('priority') !== 'false'; // Default to true

    // Always return cached data first for fast loading (filtered by state if requested)
    let filteredLocalPRs = localPullRequests;
    if (stateFilter !== 'all') {
      filteredLocalPRs = localPullRequests.filter((pr: PullRequest) => pr.status === stateFilter);
    }

    // If we have cached data and not forcing refresh, return immediately
    if (filteredLocalPRs.length > 0 && !forceRefresh) {
      // Start background sync for closed PRs if we only returned open ones
      if (stateFilter === 'open' && priorityFetch && project.repository) {
        // Don't await this - let it run in background
        syncClosedPRsInBackground(projectId, session.user.id, user.githubUsername, project.repository);
      }
      return NextResponse.json({ pullRequests: filteredLocalPRs });
    }

    // Fetch from GitHub if explicitly requested or no cached data exists
    let githubPullRequests: PullRequest[] = [];
    if (project.repository && (forceRefresh || filteredLocalPRs.length === 0)) {
      const repoInfo = parseRepositoryIdentifier(project.repository);
      if (repoInfo) {
        const githubService = await getGitHubServiceForCurrentUser(session.user.id);
        if (githubService) {
          try {
            // Use user-specific method to get only PRs authored by, assigned to, or requested for review by the user
            const fetchState = priorityFetch ? 'open' : stateFilter;
            const githubPRs = await githubService.getUserPullRequests(
              repoInfo.owner,
              repoInfo.repo,
              user.githubUsername,
              fetchState,
              priorityFetch
            );

            // Convert GitHub PRs to our format
            githubPullRequests = githubPRs.map(pr => ({
              id: `github_pr_${pr.id}`,
              title: pr.title,
              description: pr.body || undefined,
              status: pr.merged ? 'merged' : pr.state as 'open' | 'closed',
              url: pr.html_url,
              number: pr.number,
              githubId: pr.id.toString(),
              sourceBranch: pr.head.ref,
              targetBranch: pr.base.ref,
              author: pr.user.login,
              authorAvatar: pr.user.avatar_url,
              labels: JSON.stringify(pr.labels),
              assignees: JSON.stringify(pr.assignees),
              reviewers: JSON.stringify(pr.requested_reviewers),
              isDraft: pr.draft,
              mergeable: pr.mergeable || undefined,
              additions: pr.additions,
              deletions: pr.deletions,
              changedFiles: pr.changed_files,
              projectId,
              userId: session.user.id,
              createdAt: pr.created_at,
              updatedAt: pr.updated_at,
            }));

            // Sync with local database efficiently (batch upsert)
            await syncPRsToDatabase(githubPullRequests, localPullRequests);

            // If we fetched open PRs and priority fetch is enabled, start background sync for closed
            if (fetchState === 'open' && priorityFetch && stateFilter === 'all' && project.repository) {
              syncClosedPRsInBackground(projectId, session.user.id, user.githubUsername, project.repository);
            }
          } catch (error) {
            // Continue with local data if GitHub fetch fails
          }
        }
      }
    }

    // Return the appropriate data based on state filter
    let finalPRs = githubPullRequests.length > 0 ? githubPullRequests : filteredLocalPRs;
    if (stateFilter !== 'all' && githubPullRequests.length > 0) {
      finalPRs = githubPullRequests.filter((pr: PullRequest) => pr.status === stateFilter);
    }

    return NextResponse.json({ pullRequests: finalPRs });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get pull requests' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/pull-requests - Create pull request (local only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project ownership
    const project = await database.getProject(projectId);
    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    
    const newPRData: Omit<PullRequest, 'createdAt' | 'updatedAt'> = {
      id: generateId('pr'),
      title: body.title,
      description: body.description,
      status: body.status || 'open',
      url: body.url,
      number: body.number,
      githubId: body.githubId,
      sourceBranch: body.sourceBranch,
      targetBranch: body.targetBranch,
      author: body.author,
      authorAvatar: body.authorAvatar,
      labels: body.labels,
      assignees: body.assignees,
      reviewers: body.reviewers,
      isDraft: body.isDraft || false,
      mergeable: body.mergeable,
      additions: body.additions,
      deletions: body.deletions,
      changedFiles: body.changedFiles,
      projectId,
      userId: session.user.id,
    };

    const pullRequest = await database.createPullRequest(newPRData);
    return NextResponse.json({ pullRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create pull request' },
      { status: 500 }
    );
  }
}

// Helper function to efficiently sync PRs to database
async function syncPRsToDatabase(githubPRs: PullRequest[], localPRs: PullRequest[]): Promise<void> {
  const updatePromises: Promise<void>[] = [];

  for (const githubPR of githubPRs) {
    const existingPR = localPRs.find(pr => pr.githubId === githubPR.githubId);
    if (existingPR) {
      updatePromises.push(database.updatePullRequest(existingPR.id, githubPR));
    } else {
      updatePromises.push(database.createPullRequest(githubPR).then(() => {}));
    }
  }

  // Execute all database operations in parallel for better performance
  await Promise.allSettled(updatePromises);
}

// Background function to sync closed PRs (non-blocking)
function syncClosedPRsInBackground(
  projectId: string,
  userId: string,
  githubUsername: string,
  repository: string
): void {
  // Don't await this - let it run in background
  (async () => {
    try {
      const repoInfo = parseRepositoryIdentifier(repository);
      if (!repoInfo) return;

      const githubService = await getGitHubServiceForCurrentUser(userId);
      if (!githubService) return;

      // Fetch closed PRs for the user
      const closedPRs = await githubService.getUserPullRequests(
        repoInfo.owner,
        repoInfo.repo,
        githubUsername,
        'closed',
        false
      );

      // Convert and sync closed PRs
      const convertedPRs = closedPRs.map(pr => ({
        id: `github_pr_${pr.id}`,
        title: pr.title,
        description: pr.body || undefined,
        status: (pr.merged ? 'merged' : pr.state) as 'open' | 'closed' | 'merged' | 'draft',
        url: pr.html_url,
        number: pr.number,
        githubId: pr.id.toString(),
        sourceBranch: pr.head.ref,
        targetBranch: pr.base.ref,
        author: pr.user.login,
        authorAvatar: pr.user.avatar_url,
        labels: JSON.stringify(pr.labels),
        assignees: JSON.stringify(pr.assignees),
        reviewers: JSON.stringify(pr.requested_reviewers),
        isDraft: pr.draft,
        mergeable: pr.mergeable || undefined,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        projectId,
        userId,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
      }));

      // Get current local PRs to check for existing ones
      const allLocalPRs = await database.getPullRequests(projectId);
      await syncPRsToDatabase(convertedPRs, allLocalPRs);
    } catch (error) {
      // Silent error handling for background sync
    }
  })();
}

// Helper function to filter pull requests based on user's GitHub involvement
function filterUserPullRequests(pullRequests: PullRequest[], githubUsername: string): PullRequest[] {
  return pullRequests.filter(pr => {
    // Only include items that have PR characteristics - strict separation
    if (!pr.url?.includes('/pull/')) {
      return false;
    }

    // Check if user is the author
    if (pr.author === githubUsername) {
      return true;
    }

    // Check if user is assigned to the PR
    if (pr.assignees) {
      try {
        const assignees = JSON.parse(pr.assignees);
        if (Array.isArray(assignees)) {
          const isAssigned = assignees.some((assignee: any) => assignee.login === githubUsername);
          if (isAssigned) return true;
        }
      } catch (error) {
        // Silently handle JSON parse errors
      }
    }

    // Check if user is requested for review
    if (pr.reviewers) {
      try {
        const reviewers = JSON.parse(pr.reviewers);
        if (Array.isArray(reviewers)) {
          const isReviewer = reviewers.some((reviewer: any) => reviewer.login === githubUsername);
          if (isReviewer) return true;
        }
      } catch (error) {
        // Silently handle JSON parse errors
      }
    }

    return false;
  });
}
