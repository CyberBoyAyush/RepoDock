import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GitHubUserService } from '@/lib/github-user-service';

// GET /api/github/user-installation - Get current user's GitHub installation status
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const installation = await GitHubUserService.getOrCreateUserInstallation(session.user.id);
    
    if (!installation) {
      return NextResponse.json({
        hasInstallation: false,
        message: 'GitHub App not installed',
        installUrl: `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'repodock'}/installations/new`,
        availableInstallations: await GitHubUserService.getAllAvailableInstallations()
      });
    }

    return NextResponse.json({
      hasInstallation: true,
      installation: {
        installationId: installation.installationId,
        githubUsername: installation.githubUsername,
        accountType: installation.accountType,
        avatarUrl: installation.avatarUrl,
        createdAt: installation.createdAt,
      }
    });

  } catch (error) {
    console.error('GitHub user installation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/github/user-installation - Connect user to a specific GitHub installation
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { githubUsername } = body;

    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username is required' },
        { status: 400 }
      );
    }

    const installation = await GitHubUserService.refreshUserInstallation(
      session.user.id,
      githubUsername
    );

    if (!installation) {
      return NextResponse.json(
        { 
          error: 'Installation not found',
          message: `No GitHub App installation found for username: ${githubUsername}`,
          availableInstallations: await GitHubUserService.getAllAvailableInstallations()
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      installation: {
        installationId: installation.installationId,
        githubUsername: installation.githubUsername,
        accountType: installation.accountType,
        avatarUrl: installation.avatarUrl,
        createdAt: installation.createdAt,
      }
    });

  } catch (error) {
    console.error('GitHub user installation connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/github/user-installation - Remove user's GitHub installation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await GitHubUserService.removeUserInstallation(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'GitHub installation removed successfully'
    });

  } catch (error) {
    console.error('GitHub user installation remove error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
