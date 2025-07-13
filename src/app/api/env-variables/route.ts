import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';
import { envVariableSchema } from '@/lib/zodSchemas';
import { generateId } from '@/lib/utils';

// GET /api/env-variables - Get environment variables
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

    const envVariables = await database.getEnvVariables(
      session.user.id,
      projectId || undefined
    );
    
    return NextResponse.json({ envVariables });
  } catch (error) {
    console.error('Failed to get environment variables:', error);
    return NextResponse.json(
      { error: 'Failed to get environment variables' },
      { status: 500 }
    );
  }
}

// POST /api/env-variables - Create environment variable
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = envVariableSchema.parse(body);

    const newEnvVarData = {
      id: generateId('env'),
      key: validatedData.key,
      value: validatedData.value, // Should be encrypted by client before sending
      description: validatedData.description || '',
      isSecret: validatedData.isSecret ?? true,
      projectId: validatedData.projectId || undefined,
      userId: session.user.id,
    };

    const envVariable = await database.createEnvVariable(newEnvVarData);
    return NextResponse.json({ envVariable }, { status: 201 });
  } catch (error) {
    console.error('Failed to create environment variable:', error);
    return NextResponse.json(
      { error: 'Failed to create environment variable' },
      { status: 500 }
    );
  }
}
