# Better-Auth + Prisma Implementation Guide
## From localStorage to Database-Backed Authentication

This comprehensive guide explains how we migrated RepoDock.dev from localStorage-based authentication to a robust database-backed system using Better-Auth and Prisma ORM.

---

## Table of Contents
1. [Overview: localStorage vs Database Authentication](#overview)
2. [Better-Auth Setup and Configuration](#better-auth-setup)
3. [Prisma Schema Design](#prisma-schema)
4. [Database Service Layer](#database-service)
5. [Authentication Flow](#auth-flow)
6. [Migration Patterns](#migration-patterns)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview: localStorage vs Database Authentication {#overview}

### The Old Way: localStorage Authentication

**Problems with localStorage approach:**
```typescript
// ❌ OLD: localStorage-based auth (INSECURE & LIMITED)
const getUserByUsername = (username: string): User | null => {
  const users = JSON.parse(localStorage.getItem('repodock_users') || '[]');
  return users.find((user: User) => user.username === username) || null;
};

// Issues:
// 1. Data only exists in browser - no server-side validation
// 2. Easy to manipulate by users
// 3. No real password hashing/security
// 4. No session management
// 5. Data lost when browser storage is cleared
// 6. No cross-device synchronization
```

### The New Way: Database Authentication with Better-Auth

**Benefits of database approach:**
```typescript
// ✅ NEW: Database-backed auth (SECURE & SCALABLE)
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 6,
        autoSignIn: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
});

// Benefits:
// 1. Server-side validation and security
// 2. Proper password hashing (bcrypt/argon2)
// 3. Session management with expiration
// 4. Cross-device synchronization
// 5. Persistent data storage
// 6. Built-in security features (CSRF, rate limiting)
```

---

## Better-Auth Setup and Configuration {#better-auth-setup}

### 1. Server Configuration (`src/lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";

// Initialize Prisma client (singleton pattern)
const prisma = new PrismaClient();

export const auth = betterAuth({
    // Database adapter - connects Better-Auth to PostgreSQL via Prisma
    database: prismaAdapter(prisma, {
        provider: "postgresql", // Specify database type
    }),
    
    // Email/Password authentication configuration
    emailAndPassword: {
        enabled: true,                    // Enable email/password auth
        requireEmailVerification: false, // Skip email verification (as requested)
        minPasswordLength: 6,            // Minimum password length
        maxPasswordLength: 100,          // Maximum password length
        autoSignIn: true,               // Auto sign-in after successful signup
    },
    
    // Session management
    session: {
        expiresIn: 60 * 60 * 24 * 7,    // Session expires in 7 days
        updateAge: 60 * 60 * 24,        // Update session every 24 hours
    },
    
    // Environment configuration
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET!, // Required for JWT signing
});
```

### 2. Client Configuration (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    // Base URL for API requests
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    
    // Error handling configuration
    fetchOptions: {
        onError(context) {
            console.error("Auth client error:", context.error);
        },
    },
});
```

### 3. API Route Handler (`src/app/api/auth/[...all]/route.ts`)

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export GET and POST handlers for Next.js App Router
// This creates endpoints like:
// - POST /api/auth/sign-up/email
// - POST /api/auth/sign-in/email  
// - GET /api/auth/get-session
// - POST /api/auth/sign-out
export const { GET, POST } = toNextJsHandler(auth);
```

**Key Concept:** The `toNextJsHandler` converts Better-Auth's internal handler to Next.js-compatible route handlers. This is crucial for proper integration.

---

## Prisma Schema Design {#prisma-schema}

### Understanding the Schema Structure

```prisma
// Better-Auth required tables (DO NOT MODIFY)
model User {
  id            String    @id
  name          String    // Changed from 'username' to 'name' for email-only auth
  email         String
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[] // One-to-many: User can have multiple sessions
  accounts      Account[] // One-to-many: User can have multiple OAuth accounts
  
  // Application-specific relations
  workspaces    Workspace[]   // User's workspaces
  projects      Project[]     // User's projects
  envVariables  EnvVariable[] // User's environment variables
  tasks         Task[]        // User's tasks

  @@unique([email]) // Ensure email uniqueness
  @@map("user")
}

// Application data models
model Workspace {
  id          String    @id
  name        String
  description String?
  color       String?   // Hex color for UI
  userId      String    // Foreign key to User
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  isDefault   Boolean   @default(false)
  
  // Relations
  projects    Project[] // One-to-many: Workspace can have multiple projects

  @@map("workspace")
}
```

**Key Concepts:**

1. **Foreign Keys**: `userId` creates a relationship between tables
2. **Cascade Deletion**: When a user is deleted, all related data is automatically deleted
3. **Indexes**: `@@unique([email])` creates a database index for fast email lookups
4. **Default Values**: `@default(now())` automatically sets creation timestamp

### Migration from localStorage Schema

```typescript
// ❌ OLD: localStorage structure
interface User {
  id: string;
  username: string;  // ← Changed to 'name'
  email: string;
  passwordHash: string; // ← Removed (Better-Auth handles this)
  createdAt: string;
  updatedAt: string;
}

// ✅ NEW: Database schema
model User {
  id            String    @id
  name          String    // ← Was 'username'
  email         String
  emailVerified Boolean   // ← New field
  image         String?   // ← New field
  createdAt     DateTime  // ← Changed from string to DateTime
  updatedAt     DateTime  // ← Changed from string to DateTime
  // passwordHash removed - Better-Auth handles password storage securely
}
```

---

## Database Service Layer {#database-service}

### Singleton Pattern Implementation

```typescript
// src/lib/database.ts
import { PrismaClient } from '@/generated/prisma';

// Singleton pattern ensures only one database connection
class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  // ... methods
}

export const database = DatabaseService.getInstance();
```

**Why Singleton?** Prevents multiple database connections and ensures consistent state across the application.

### CRUD Operations Pattern

```typescript
// Generic CRUD pattern used throughout the service
class DatabaseService {
  // CREATE operation
  async createWorkspace(workspace: Omit<Workspace, 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const created = await this.prisma.workspace.create({
      data: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        color: workspace.color,
        userId: workspace.userId,
        isDefault: workspace.isDefault || false,
      },
    });

    // Transform database result to application type
    return {
      id: created.id,
      name: created.name,
      description: created.description || undefined,
      color: created.color || undefined,
      userId: created.userId,
      createdAt: created.createdAt.toISOString(), // Convert Date to string
      updatedAt: created.updatedAt.toISOString(),
      isDefault: created.isDefault,
    };
  }

  // READ operation
  async getWorkspaces(userId: string): Promise<Workspace[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { userId },           // Filter by user
      orderBy: { createdAt: 'desc' }, // Sort by creation date
    });

    // Transform array of database results
    return workspaces.map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || undefined,
      color: workspace.color || undefined,
      userId: workspace.userId,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
      isDefault: workspace.isDefault,
    }));
  }

  // UPDATE operation
  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<void> {
    await this.prisma.workspace.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        color: updates.color,
        isDefault: updates.isDefault,
        // updatedAt is automatically updated by Prisma
      },
    });
  }

  // DELETE operation
  async deleteWorkspace(id: string): Promise<void> {
    await this.prisma.workspace.delete({
      where: { id },
    });
    // Cascade deletion automatically removes related projects, tasks, etc.
  }
}
```

**Key Concepts:**

1. **Type Safety**: Using `Omit<Workspace, 'createdAt' | 'updatedAt'>` ensures we don't pass auto-generated fields
2. **Data Transformation**: Converting between database types (Date) and application types (string)
3. **Error Handling**: Prisma automatically throws errors for constraint violations
4. **Filtering**: Using `where` clauses to ensure users only access their own data

---

## Authentication Flow {#auth-flow}

### Complete Authentication Process

```typescript
// src/features/auth/useAuth.ts - Zustand store for auth state management

// 1. SIGNUP FLOW
signup: async (credentials: SignupCredentials) => {
  set({ isLoading: true, error: null });

  try {
    // Call Better-Auth signup endpoint
    const { data, error } = await authClient.signUp.email({
      name: credentials.name,     // User's display name
      email: credentials.email,   // Login identifier
      password: credentials.password,
    });

    if (error) {
      set({ 
        error: error.message || 'Signup failed. Please try again.',
        isLoading: false 
      });
      return false;
    }

    if (data?.user) {
      // Convert Better-Auth user format to our application format
      const user = convertBetterAuthUser(data.user);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Initialize default data for new user
      await database.initializeDefaultData(user.id);

      return true;
    }
  } catch (error) {
    set({
      error: 'Signup failed. Please try again.',
      isLoading: false,
    });
    return false;
  }
},

// 2. LOGIN FLOW
login: async (credentials: LoginCredentials) => {
  set({ isLoading: true, error: null });

  try {
    // Call Better-Auth signin endpoint
    const { data, error } = await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      set({ 
        error: error.message || 'Login failed. Please try again.',
        isLoading: false 
      });
      return false;
    }

    if (data?.user) {
      const user = convertBetterAuthUser(data.user);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    }
  } catch (error) {
    set({
      error: 'Login failed. Please try again.',
      isLoading: false,
    });
    return false;
  }
},

// 3. SESSION CHECK FLOW
checkAuthStatus: async () => {
  try {
    // Check if user has valid session
    const session = await authClient.getSession();
    if (session?.data?.user) {
      const user = convertBetterAuthUser(session.data.user);
      set({
        user,
        isAuthenticated: true,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  } catch (error) {
    console.error('Check auth status error:', error);
    set({
      user: null,
      isAuthenticated: false,
    });
  }
},

// 4. LOGOUT FLOW
logout: async () => {
  const { user } = get();

  try {
    // Clear encryption keys (application-specific)
    if (user) {
      encryptionService.clearMasterKey(user.id);
      encryptionService.clearUserEncryptionPassword(user.email);
    }

    // Sign out from Better-Auth (clears session)
    await authClient.signOut();

    // Reset local state
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still reset state even if logout fails
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }
},
```

### Session Management

```typescript
// Helper function to convert Better-Auth user to application User type
const convertBetterAuthUser = (betterAuthUser: any): User => {
  return {
    id: betterAuthUser.id,
    name: betterAuthUser.name,           // Display name
    email: betterAuthUser.email,         // Login identifier
    emailVerified: betterAuthUser.emailVerified,
    image: betterAuthUser.image,
    createdAt: betterAuthUser.createdAt,
    updatedAt: betterAuthUser.updatedAt,
  };
};
```

**Key Concepts:**

1. **State Management**: Zustand provides reactive state updates across components
2. **Error Handling**: Comprehensive error handling with user-friendly messages
3. **Loading States**: UI feedback during async operations
4. **Session Persistence**: Better-Auth handles session cookies automatically
5. **Type Safety**: Converting between Better-Auth types and application types

---

## Migration Patterns {#migration-patterns}

### From localStorage to Database Operations

```typescript
// ❌ OLD: localStorage operations
const useWorkspaces = create<WorkspaceStore>()((set, get) => ({
  loadWorkspaces: (userId: string) => {
    // Synchronous localStorage read
    const workspaces = localDB.getUserWorkspaces(userId);
    set({ workspaces });
  },
  
  createWorkspace: async (data: WorkspaceFormData, userId: string) => {
    const newWorkspace: Workspace = {
      id: generateId('workspace'),
      name: data.name,
      // ... other fields
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Synchronous localStorage write
    localDB.createWorkspace(newWorkspace);
    
    // Update local state
    const workspaces = [...get().workspaces, newWorkspace];
    set({ workspaces });
    
    return newWorkspace;
  },
}));

// ✅ NEW: Database operations
const useWorkspaces = create<WorkspaceStore>()((set, get) => ({
  loadWorkspaces: async (userId: string) => { // ← Now async
    set({ isLoading: true, error: null });

    try {
      // Asynchronous database read
      const workspaces = await database.getWorkspaces(userId);
      set({ workspaces, isLoading: false });
    } catch (error) {
      set({
        error: 'Failed to load workspaces',
        isLoading: false,
      });
    }
  },
  
  createWorkspace: async (data: WorkspaceFormData, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const newWorkspaceData: Omit<Workspace, 'createdAt' | 'updatedAt'> = {
        id: generateId('workspace'),
        name: data.name,
        // ... other fields
        userId,
        isDefault: false,
      };

      // Asynchronous database write
      const newWorkspace = await database.createWorkspace(newWorkspaceData);

      // Update local state
      const workspaces = [...get().workspaces, newWorkspace];
      set({ workspaces, isLoading: false });

      return newWorkspace;
    } catch (error) {
      set({
        error: 'Failed to create workspace',
        isLoading: false,
      });
      throw error;
    }
  },
}));
```

### Component Usage Pattern Changes

```typescript
// ❌ OLD: Synchronous component usage
const WorkspaceList = () => {
  const { workspaces, loadWorkspaces } = useWorkspaces();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWorkspaces(user.id); // Synchronous call
    }
  }, [user]);

  return (
    <div>
      {workspaces.map(workspace => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
};

// ✅ NEW: Asynchronous component usage with loading states
const WorkspaceList = () => {
  const { workspaces, loadWorkspaces, isLoading, error } = useWorkspaces();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await loadWorkspaces(user.id); // Asynchronous call
      }
    };
    
    loadData();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div>
      {workspaces.map(workspace => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
};
```

**Migration Checklist:**

1. ✅ Change all data operations from synchronous to asynchronous
2. ✅ Add loading and error states to all stores
3. ✅ Update component useEffect hooks to handle async operations
4. ✅ Add proper error handling and user feedback
5. ✅ Update type definitions to remove localStorage-specific fields
6. ✅ Test all CRUD operations with database

---

## API Architecture {#api-architecture}

### Client-Server Separation

To prevent Prisma from running in the browser, all database operations are handled through API routes:

```
Client Components → API Routes → Database Service → Prisma → PostgreSQL
```

### API Route Structure

```
src/app/api/
├── auth/[...all]/route.ts     # Better-Auth endpoints
├── workspaces/
│   ├── route.ts               # GET /api/workspaces, POST /api/workspaces
│   └── [id]/route.ts          # PUT /api/workspaces/[id], DELETE /api/workspaces/[id]
├── projects/
│   ├── route.ts               # GET /api/projects, POST /api/projects
│   └── [id]/route.ts          # PUT /api/projects/[id], DELETE /api/projects/[id]
└── env-variables/
    ├── route.ts               # GET /api/env-variables, POST /api/env-variables
    └── [id]/route.ts          # PUT /api/env-variables/[id], DELETE /api/env-variables/[id]
```

### API Route Pattern

```typescript
// src/app/api/workspaces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Call database service
    const workspaces = await database.getWorkspaces(session.user.id);

    // 3. Return response
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Client-Side Usage

```typescript
// Client component
const useWorkspaces = create<WorkspaceStore>()((set, get) => ({
  loadWorkspaces: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/workspaces');

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const { workspaces } = await response.json();
      set({ workspaces, isLoading: false });
    } catch (error) {
      set({
        error: 'Failed to load workspaces',
        isLoading: false,
      });
    }
  },
}));
```

---

## Best Practices {#best-practices}

### 1. Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling
const createProject = async (data: ProjectFormData) => {
  set({ isLoading: true, error: null });

  try {
    const newProject = await database.createProject(data);
    
    // Update optimistic UI
    const projects = [...get().projects, newProject];
    set({ projects, isLoading: false });
    
    return newProject;
  } catch (error) {
    // Log for debugging
    console.error('Failed to create project:', error);
    
    // User-friendly error message
    set({
      error: 'Failed to create project. Please try again.',
      isLoading: false,
    });
    
    // Re-throw for component handling
    throw error;
  }
};
```

### 2. Type Safety

```typescript
// ✅ GOOD: Strict typing
interface CreateWorkspaceData extends Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> {
  // Explicitly define what fields are required for creation
}

const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
  // TypeScript ensures we don't pass invalid data
  return await database.createWorkspace({
    id: generateId('workspace'),
    ...data,
  });
};
```

### 3. Data Validation

```typescript
// ✅ GOOD: Validate data before database operations
import { z } from 'zod';

const workspaceSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const createWorkspace = async (data: unknown) => {
  // Validate input data
  const validatedData = workspaceSchema.parse(data);
  
  // Proceed with database operation
  return await database.createWorkspace({
    id: generateId('workspace'),
    userId: getCurrentUserId(),
    ...validatedData,
  });
};
```

### 4. Session Management

```typescript
// ✅ GOOD: Check authentication status on app load
const App = () => {
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    // Check if user has valid session on app startup
    checkAuthStatus();
  }, []);

  // ... rest of app
};
```

---

## Troubleshooting {#troubleshooting}

### Common Issues and Solutions

#### 1. 405 Method Not Allowed Errors

**Problem:** Getting 405 errors on auth endpoints

**Solution:** Ensure you're using `toNextJsHandler` correctly:

```typescript
// ❌ WRONG
export const { GET, POST } = auth.handler;

// ✅ CORRECT
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

#### 2. Prisma Client Browser Error

**Problem:** `PrismaClient is unable to run in this browser environment` error

**Solution:** Ensure database operations are only called on the server-side:

```typescript
// ❌ WRONG: Direct database import in client component
import { database } from '@/lib/database';

const MyComponent = () => {
  useEffect(() => {
    const loadData = async () => {
      const data = await database.getWorkspaces(userId); // This runs in browser!
    };
  }, []);
};

// ✅ CORRECT: Use API routes for database operations
const MyComponent = () => {
  useEffect(() => {
    const loadData = async () => {
      const response = await fetch('/api/workspaces'); // This calls server
      const { workspaces } = await response.json();
    };
  }, []);
};
```

#### 3. Database Connection Issues

**Problem:** Prisma client connection errors

**Solution:** Check your database URL and ensure the database is running:

```bash
# Check if PostgreSQL is running
pg_isready

# Test database connection
pnpm prisma db push

# Regenerate Prisma client
pnpm prisma generate
```

#### 3. Session Not Persisting

**Problem:** User gets logged out on page refresh

**Solution:** Ensure Better-Auth is properly configured with session management:

```typescript
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Update every 24 hours
  },
  // Ensure secret is set for JWT signing
  secret: process.env.BETTER_AUTH_SECRET!,
});
```

#### 4. Type Errors with Prisma

**Problem:** TypeScript errors with Prisma generated types

**Solution:** Regenerate Prisma client after schema changes:

```bash
pnpm prisma generate
```

#### 5. Environment Variables

**Problem:** Authentication not working in production

**Solution:** Ensure all required environment variables are set:

```env
# Required for Better-Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=https://your-domain.com

# Required for Prisma
DATABASE_URL=postgresql://username:password@localhost:5432/repodock
```

---

## Summary

This migration from localStorage to Better-Auth + Prisma provides:

1. **Security**: Proper password hashing, session management, CSRF protection
2. **Scalability**: Database-backed storage, proper indexing, efficient queries
3. **Reliability**: Data persistence, backup capabilities, transaction support
4. **User Experience**: Cross-device synchronization, proper session handling
5. **Developer Experience**: Type safety, comprehensive error handling, modern patterns

The key to successful implementation is understanding the asynchronous nature of database operations and properly handling loading states, errors, and user feedback throughout the application.
