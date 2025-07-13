// Location: src/lib/database.ts
// Description: Database service layer for RepoDock.dev - handles all database operations using Prisma, replacing localStorage functionality

import { PrismaClient } from '@/generated/prisma';
import {
  User,
  Workspace,
  Project,
  EnvVariable,
  Task
} from '@/types';

// Singleton Prisma client
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

  // User operations
  async getUser(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  // Workspace operations
  async getWorkspaces(userId: string): Promise<Workspace[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

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

  async getWorkspace(id: string): Promise<Workspace | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) return null;

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || undefined,
      color: workspace.color || undefined,
      userId: workspace.userId,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
      isDefault: workspace.isDefault,
    };
  }

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

    return {
      id: created.id,
      name: created.name,
      description: created.description || undefined,
      color: created.color || undefined,
      userId: created.userId,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      isDefault: created.isDefault,
    };
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<void> {
    await this.prisma.workspace.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        color: updates.color,
        isDefault: updates.isDefault,
      },
    });
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.prisma.workspace.delete({
      where: { id },
    });
  }

  // Project operations
  async getProjects(workspaceId?: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      workspaceId: project.workspaceId,
      userId: project.userId,
      repository: project.repository || undefined,
      status: project.status as Project['status'],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));
  }

  async getProject(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) return null;

    return {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      workspaceId: project.workspaceId,
      userId: project.userId,
      repository: project.repository || undefined,
      status: project.status as Project['status'],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  async createProject(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<Project> {
    const created = await this.prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        workspaceId: project.workspaceId,
        userId: project.userId,
        repository: project.repository,
        status: project.status,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description || undefined,
      workspaceId: created.workspaceId,
      userId: created.userId,
      repository: created.repository || undefined,
      status: created.status as Project['status'],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    await this.prisma.project.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        repository: updates.repository,
        status: updates.status,
      },
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  // Environment variables operations
  async getEnvVariables(userId: string, projectId?: string): Promise<EnvVariable[]> {
    const envVars = await this.prisma.envVariable.findMany({
      where: {
        userId,
        projectId: projectId || null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return envVars.map(envVar => ({
      id: envVar.id,
      key: envVar.key,
      value: envVar.value,
      description: envVar.description || undefined,
      isSecret: envVar.isSecret,
      projectId: envVar.projectId || undefined,
      userId: envVar.userId,
      createdAt: envVar.createdAt.toISOString(),
      updatedAt: envVar.updatedAt.toISOString(),
    }));
  }

  async getEnvVariable(id: string): Promise<EnvVariable | null> {
    const envVar = await this.prisma.envVariable.findUnique({
      where: { id },
    });

    if (!envVar) return null;

    return {
      id: envVar.id,
      key: envVar.key,
      value: envVar.value,
      description: envVar.description || undefined,
      isSecret: envVar.isSecret,
      projectId: envVar.projectId || undefined,
      userId: envVar.userId,
      createdAt: envVar.createdAt.toISOString(),
      updatedAt: envVar.updatedAt.toISOString(),
    };
  }

  async createEnvVariable(envVar: Omit<EnvVariable, 'createdAt' | 'updatedAt'>): Promise<EnvVariable> {
    const created = await this.prisma.envVariable.create({
      data: {
        id: envVar.id,
        key: envVar.key,
        value: envVar.value,
        description: envVar.description,
        isSecret: envVar.isSecret,
        projectId: envVar.projectId,
        userId: envVar.userId,
      },
    });

    return {
      id: created.id,
      key: created.key,
      value: created.value,
      description: created.description || undefined,
      isSecret: created.isSecret,
      projectId: created.projectId || undefined,
      userId: created.userId,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateEnvVariable(id: string, updates: Partial<EnvVariable>): Promise<void> {
    await this.prisma.envVariable.update({
      where: { id },
      data: {
        key: updates.key,
        value: updates.value,
        description: updates.description,
        isSecret: updates.isSecret,
      },
    });
  }

  async deleteEnvVariable(id: string): Promise<void> {
    await this.prisma.envVariable.delete({
      where: { id },
    });
  }

  // Task operations
  async getTasks(projectId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status as Task['status'],
      priority: task.priority as Task['priority'],
      projectId: task.projectId,
      userId: task.userId,
      assignedTo: task.assignedTo || undefined,
      dueDate: task.dueDate?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
  }

  async getTask(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) return null;

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status as Task['status'],
      priority: task.priority as Task['priority'],
      projectId: task.projectId,
      userId: task.userId,
      assignedTo: task.assignedTo || undefined,
      dueDate: task.dueDate?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async createTask(task: Omit<Task, 'createdAt' | 'updatedAt'>): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        userId: task.userId,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      },
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description || undefined,
      status: created.status as Task['status'],
      priority: created.priority as Task['priority'],
      projectId: created.projectId,
      userId: created.userId,
      assignedTo: created.assignedTo || undefined,
      dueDate: created.dueDate?.toISOString(),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await this.prisma.task.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        assignedTo: updates.assignedTo,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
      },
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id },
    });
  }

  // Initialize default data for new users
  async initializeDefaultData(userId: string): Promise<void> {
    const existingWorkspaces = await this.getWorkspaces(userId);
    if (existingWorkspaces.length === 0) {
      const defaultWorkspace: Omit<Workspace, 'createdAt' | 'updatedAt'> = {
        id: `workspace_${Date.now()}`,
        name: 'Default Workspace',
        description: 'Your default workspace',
        color: '#3b82f6',
        userId,
        isDefault: true,
      };
      await this.createWorkspace(defaultWorkspace);
    }
  }

  // Cleanup method
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const database = DatabaseService.getInstance();
