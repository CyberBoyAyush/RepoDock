import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGitHubServiceForCurrentUser } from '@/lib/github-user-service';

// GET /api/github/repositories - Get accessible GitHub repositories for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const githubService = await getGitHubServiceForCurrentUser(session.user.id);

      if (!githubService) {
        return NextResponse.json(
          {
            error: 'GitHub App not installed',
            message: 'Please install the RepoDock GitHub App on your account to access repositories',
            installUrl: `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'repodock'}/installations/new`
          },
          { status: 400 }
        );
      }

      const repositories = await githubService.getAccessibleRepositories();
      return NextResponse.json({ repositories });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch repositories from GitHub App' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('GitHub repositories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
