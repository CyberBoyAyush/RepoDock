import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { taskSchema } from '@/lib/zodSchemas';
import { generateId } from '@/lib/utils';

// GET /api/tasks - Get tasks for a project
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const tasks = await database.getTasks(projectId);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create task
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    const newTaskData = {
      id: generateId('task'),
      title: validatedData.title,
      description: validatedData.description || '',
      status: validatedData.status || 'todo',
      priority: validatedData.priority || 'medium',
      projectId: validatedData.projectId,
      userId: session.user.id,
      assignedTo: validatedData.assignedTo || '',
      dueDate: validatedData.dueDate || '',
    };

    const task = await database.createTask(newTaskData);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
