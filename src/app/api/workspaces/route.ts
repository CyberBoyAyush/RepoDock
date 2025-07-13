import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { workspaceSchema } from '@/lib/zodSchemas';
import { generateId } from '@/lib/utils';

// GET /api/workspaces - Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await database.getWorkspaces(session.user.id);
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Failed to get workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to get workspaces' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = workspaceSchema.parse(body);

    const newWorkspaceData = {
      id: generateId('workspace'),
      name: validatedData.name,
      description: validatedData.description || '',
      color: '#3b82f6', // Default color
      userId: session.user.id,
      isDefault: false,
    };

    const workspace = await database.createWorkspace(newWorkspaceData);
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
