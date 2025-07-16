import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseRepositoryIdentifier } from '@/lib/github-app';
import { getGitHubServiceForCurrentUser } from '@/lib/github-user-service';
import { issueSchema } from '@/lib/zodSchemas';

// GET /api/issues/[id] - Get specific issue
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

    const { id: issueId } = await params;
    const issue = await database.getIssue(issueId);

    if (!issue || issue.userId !== session.user.id) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Failed to get issue:', error);
    return NextResponse.json(
      { error: 'Failed to get issue' },
      { status: 500 }
    );
  }
}

// PUT /api/issues/[id] - Update issue
export async function PUT(
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

    const { id: issueId } = await params;
    const issue = await database.getIssue(issueId);

    if (!issue || issue.userId !== session.user.id) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = issueSchema.partial().parse(body);

    // If issue has GitHub ID, update on GitHub as well
    if (issue.githubId && issue.number) {
      const project = await database.getProject(issue.projectId);
      if (project?.repository) {
        const repoInfo = parseRepositoryIdentifier(project.repository);
        if (repoInfo) {
          const githubService = await getGitHubServiceForCurrentUser(session.user.id);
          if (githubService) {
            try {
              await githubService.updateIssue(repoInfo.owner, repoInfo.repo, issue.number, {
                title: validatedData.title,
                body: validatedData.description,
                state: validatedData.status === 'closed' ? 'closed' : 'open',
                assignees: validatedData.assignedTo ? [validatedData.assignedTo] : undefined,
              });
            } catch (error) {
              console.error('Failed to update GitHub issue:', error);
              // Continue with local update even if GitHub update fails
            }
          }
        }
      }
    }

    // Update local issue
    await database.updateIssue(issueId, validatedData);

    return NextResponse.json({ message: 'Issue updated successfully' });
  } catch (error) {
    console.error('Failed to update issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}

// DELETE /api/issues/[id] - Delete issue
export async function DELETE(
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

    const { id: issueId } = await params;
    const issue = await database.getIssue(issueId);

    if (!issue || issue.userId !== session.user.id) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Note: We don't delete issues from GitHub, only from local database
    // This is because GitHub issues are typically closed rather than deleted
    await database.deleteIssue(issueId);

    return NextResponse.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Failed to delete issue:', error);
    return NextResponse.json(
      { error: 'Failed to delete issue' },
      { status: 500 }
    );
  }
}
