import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseRepositoryIdentifier } from '@/lib/github-app';
import { getGitHubServiceForCurrentUser } from '@/lib/github-user-service';
import { generateId } from '@/lib/utils';
import { Issue } from '@/types';
import { issueSchema } from '@/lib/zodSchemas';

// GET /api/projects/[id]/issues - Get issues for project
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

    // Get local issues from database
    const allLocalIssues = await database.getIssues(projectId);

    // Filter issues to only include those assigned to or created by the current user
    const localIssues = filterUserIssues(allLocalIssues, user.githubUsername);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const stateFilter = searchParams.get('state') as 'open' | 'closed' | 'all' || 'all';
    const priorityFetch = searchParams.get('priority') !== 'false'; // Default to true

    // Always return cached data first for fast loading (filtered by state if requested)
    let filteredLocalIssues = localIssues;
    if (stateFilter !== 'all') {
      filteredLocalIssues = localIssues.filter((issue: Issue) => issue.status === stateFilter);
    }

    // If we have cached data and not forcing refresh, return immediately
    if (filteredLocalIssues.length > 0 && !forceRefresh) {
      // Start background sync for closed issues if we only returned open ones
      if (stateFilter === 'open' && priorityFetch && project.repository) {
        // Don't await this - let it run in background
        syncClosedIssuesInBackground(projectId, session.user.id, user.githubUsername, project.repository);
      }
      return NextResponse.json({ issues: filteredLocalIssues });
    }

    // Fetch from GitHub if explicitly requested or no cached data exists
    let githubIssues: Issue[] = [];
    if (project.repository && (forceRefresh || filteredLocalIssues.length === 0)) {
      const repoInfo = parseRepositoryIdentifier(project.repository);
      if (repoInfo) {
        const githubService = await getGitHubServiceForCurrentUser(session.user.id);
        if (githubService) {
          try {
            // Use user-specific method to get only issues assigned to or created by the user
            const fetchState = priorityFetch ? 'open' : stateFilter;
            const githubUserIssues = await githubService.getUserIssues(
              repoInfo.owner,
              repoInfo.repo,
              user.githubUsername,
              fetchState,
              priorityFetch
            );

            // Convert GitHub issues to our format
            githubIssues = githubUserIssues.map(issue => ({
              id: `github_issue_${issue.id}`,
              title: issue.title,
              description: issue.body || undefined,
              status: issue.state as 'open' | 'closed',
              priority: 'medium', // Default priority, could be inferred from labels
              type: 'bug', // Default type, could be inferred from labels
              url: issue.html_url,
              number: issue.number,
              githubId: issue.id.toString(),
              author: issue.user.login,
              authorAvatar: issue.user.avatar_url,
              assignees: JSON.stringify(issue.assignees),
              labels: JSON.stringify(issue.labels),
              milestone: issue.milestone?.title,
              state: issue.state,
              stateReason: issue.state_reason || undefined,
              comments: issue.comments,
              reactions: JSON.stringify(issue.reactions),
              locked: issue.locked,
              projectId,
              userId: session.user.id,
              createdAt: issue.created_at,
              updatedAt: issue.updated_at,
            }));

            // Sync with local database efficiently (batch upsert)
            await syncIssuesToDatabase(githubIssues, localIssues);

            // If we fetched open issues and priority fetch is enabled, start background sync for closed
            if (fetchState === 'open' && priorityFetch && stateFilter === 'all' && project.repository) {
              syncClosedIssuesInBackground(projectId, session.user.id, user.githubUsername, project.repository);
            }
          } catch (error) {
            // Continue with local data if GitHub fetch fails
          }
        }
      }
    }

    // Return the appropriate data based on state filter
    let finalIssues = githubIssues.length > 0 ? githubIssues : filteredLocalIssues;
    if (stateFilter !== 'all' && githubIssues.length > 0) {
      finalIssues = githubIssues.filter((issue: Issue) => issue.status === stateFilter);
    }

    return NextResponse.json({ issues: finalIssues });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get issues' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/issues - Create issue
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
    const validatedData = issueSchema.parse(body);

    // If project has GitHub repository, create issue on GitHub first
    let githubIssue = null;
    if (project.repository && body.createOnGitHub !== false) {
      const repoInfo = parseRepositoryIdentifier(project.repository);
      if (repoInfo) {
        const githubService = await getGitHubServiceForCurrentUser(session.user.id);
        if (githubService) {
          try {
            githubIssue = await githubService.createIssue(repoInfo.owner, repoInfo.repo, {
              title: validatedData.title,
              body: validatedData.description,
              assignees: validatedData.assignedTo ? [validatedData.assignedTo] : undefined,
              labels: [], // Could be mapped from type/priority
            });
          } catch (error) {
            return NextResponse.json(
              { error: 'Failed to create issue on GitHub' },
              { status: 500 }
            );
          }
        }
      }
    }

    // Create local issue
    const newIssueData: Omit<Issue, 'createdAt' | 'updatedAt'> = {
      id: generateId('issue'),
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      priority: validatedData.priority,
      type: validatedData.type,
      url: githubIssue?.html_url,
      number: githubIssue?.number,
      githubId: githubIssue?.id.toString(),
      author: githubIssue?.user.login || session.user.name,
      authorAvatar: githubIssue?.user.avatar_url,
      assignees: githubIssue ? JSON.stringify(githubIssue.assignees) : (validatedData.assignedTo ? JSON.stringify([validatedData.assignedTo]) : undefined),
      labels: githubIssue ? JSON.stringify(githubIssue.labels) : undefined,
      milestone: githubIssue?.milestone?.title,
      state: githubIssue?.state,
      stateReason: githubIssue?.state_reason,
      comments: githubIssue?.comments || 0,
      reactions: githubIssue ? JSON.stringify(githubIssue.reactions) : undefined,
      locked: githubIssue?.locked || false,
      projectId,
      userId: session.user.id,
    };

    const issue = await database.createIssue(newIssueData);
    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

// Helper function to efficiently sync issues to database
async function syncIssuesToDatabase(githubIssues: Issue[], localIssues: Issue[]): Promise<void> {
  const updatePromises: Promise<void>[] = [];

  for (const githubIssue of githubIssues) {
    const existingIssue = localIssues.find(issue => issue.githubId === githubIssue.githubId);
    if (existingIssue) {
      updatePromises.push(database.updateIssue(existingIssue.id, githubIssue));
    } else {
      updatePromises.push(database.createIssue(githubIssue).then(() => {}));
    }
  }

  // Execute all database operations in parallel for better performance
  await Promise.allSettled(updatePromises);
}

// Background function to sync closed issues (non-blocking)
function syncClosedIssuesInBackground(
  projectId: string,
  userId: string,
  githubUsername: string,
  repository: string | null
): void {
  // Don't await this - let it run in background
  (async () => {
    try {
      if (!repository) return;

      const repoInfo = parseRepositoryIdentifier(repository);
      if (!repoInfo) return;

      const githubService = await getGitHubServiceForCurrentUser(userId);
      if (!githubService) return;

      // Fetch closed issues for the user
      const closedIssues = await githubService.getUserIssues(
        repoInfo.owner,
        repoInfo.repo,
        githubUsername,
        'closed',
        false
      );

      // Convert and sync closed issues
      const convertedIssues = closedIssues.map(issue => ({
        id: `github_issue_${issue.id}`,
        title: issue.title,
        description: issue.body || undefined,
        status: issue.state as 'open' | 'closed',
        priority: 'medium' as const,
        type: 'bug' as const,
        url: issue.html_url,
        number: issue.number,
        githubId: issue.id.toString(),
        author: issue.user.login,
        authorAvatar: issue.user.avatar_url,
        assignees: JSON.stringify(issue.assignees),
        labels: JSON.stringify(issue.labels),
        milestone: issue.milestone?.title,
        state: issue.state,
        stateReason: issue.state_reason || undefined,
        comments: issue.comments,
        reactions: JSON.stringify(issue.reactions),
        locked: issue.locked,
        projectId,
        userId,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      }));

      // Get current local issues to check for existing ones
      const allLocalIssues = await database.getIssues(projectId);
      await syncIssuesToDatabase(convertedIssues, allLocalIssues);
    } catch (error) {
      // Silent error handling for background sync
    }
  })();
}

// Helper function to filter issues based on user's GitHub involvement
function filterUserIssues(issues: Issue[], githubUsername: string): Issue[] {
  return issues.filter(issue => {
    // Skip if this looks like a pull request - strict separation
    if (issue.url?.includes('/pull/')) {
      return false;
    }

    // Check if user is the author
    if (issue.author === githubUsername) {
      return true;
    }

    // Check if user is assigned to the issue
    if (issue.assignees) {
      try {
        const assignees = JSON.parse(issue.assignees);
        if (Array.isArray(assignees)) {
          return assignees.some((assignee: any) => assignee.login === githubUsername);
        }
      } catch (error) {
        // Silently handle JSON parse errors
      }
    }

    return false;
  });
}
