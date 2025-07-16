import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';

// POST /api/projects/[id]/disconnect-repository - Disconnect repository and clean up all related data
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

    // Get project to verify ownership
    const project = await database.getProject(projectId);
    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.repository) {
      return NextResponse.json({ error: 'No repository connected to this project' }, { status: 400 });
    }

    // Clean up all GitHub-related data for this project
    await cleanupRepositoryData(projectId);

    // Update project to remove repository connection
    await database.updateProject(projectId, {
      repository: null,
      githubOwner: null,
      githubRepo: null,
      githubRepoId: null,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Repository disconnected and all related data cleaned up successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to disconnect repository' },
      { status: 500 }
    );
  }
}

// Helper function to clean up all repository-related data
async function cleanupRepositoryData(projectId: string): Promise<void> {
  try {
    // Delete all issues for this project
    const issues = await database.getIssues(projectId);
    for (const issue of issues) {
      if (issue.githubId) { // Only delete GitHub-synced issues
        await database.deleteIssue(issue.id);
      }
    }

    // Delete all pull requests for this project
    const pullRequests = await database.getPullRequests(projectId);
    for (const pr of pullRequests) {
      if (pr.githubId) { // Only delete GitHub-synced PRs
        await database.deletePullRequest(pr.id);
      }
    }

    // Note: We keep local tasks and env variables as they're not GitHub-specific
  } catch (error) {
    throw new Error('Failed to clean up repository data');
  }
}
