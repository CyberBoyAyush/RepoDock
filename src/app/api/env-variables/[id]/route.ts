import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { envVariableSchema } from '@/lib/zodSchemas';

// PUT /api/env-variables/[id] - Update environment variable
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = envVariableSchema.partial().parse(body);

    // Convert null/empty projectId to undefined to match EnvVariable interface
    const updateData = {
      ...validatedData,
      projectId: validatedData.projectId || undefined,
    };

    await database.updateEnvVariable(id, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update environment variable:', error);
    return NextResponse.json(
      { error: 'Failed to update environment variable' },
      { status: 500 }
    );
  }
}

// DELETE /api/env-variables/[id] - Delete environment variable
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await database.deleteEnvVariable(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete environment variable:', error);
    return NextResponse.json(
      { error: 'Failed to delete environment variable' },
      { status: 500 }
    );
  }
}
