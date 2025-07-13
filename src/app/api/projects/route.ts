import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { projectSchema } from '@/lib/zodSchemas';
import { generateId } from '@/lib/utils';

// GET /api/projects - Get projects
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    const projects = await database.getProjects(workspaceId || undefined);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to get projects:', error);
    return NextResponse.json(
      { error: 'Failed to get projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    const newProjectData = {
      id: generateId('project'),
      name: validatedData.name,
      description: validatedData.description || '',
      repository: validatedData.repository || '',
      status: validatedData.status || 'active',
      workspaceId: validatedData.workspaceId,
      userId: session.user.id,
    };

    const project = await database.createProject(newProjectData);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
