import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { workspaceSchema } from '@/lib/zodSchemas';

// PUT /api/workspaces/[id] - Update workspace
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

    const { id: workspaceId } = await params;
    const body = await request.json();
    const validatedData = workspaceSchema.partial().parse(body);

    await database.updateWorkspace(workspaceId, validatedData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
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

    const { id: workspaceId } = await params;
    await database.deleteWorkspace(workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
