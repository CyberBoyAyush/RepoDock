// Location: src/app/dashboard/page.tsx
// Description: Dashboard home page for RepoDock.dev - displays the main dashboard with workspace overview, recent projects, and quick actions for authenticated users

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { useProjects } from '@/features/projects/useProjects';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WorkspaceForm } from '@/features/workspaces/WorkspaceForm';
import { ProjectForm } from '@/features/projects/ProjectForm';
import { 
  Plus, 
  Folder, 
  Clock, 
  CheckSquare, 
  GitBranch, 
  Bug,
  Settings,
  BarChart3
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();
  const { projects } = useProjects();
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const router = useRouter();

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    archivedProjects: projects.filter(p => p.status === 'archived').length,
    draftProjects: projects.filter(p => p.status === 'draft').length,
  };

  if (!currentWorkspace) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No workspace selected</h2>
          <p className="text-muted-foreground mb-6">
            Create your first workspace to get started with RepoDock.
          </p>
          <Button onClick={() => setShowWorkspaceModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        </div>

        <Modal
          isOpen={showWorkspaceModal}
          onClose={() => setShowWorkspaceModal(false)}
          title="Create Workspace"
          size="md"
        >
          <WorkspaceForm
            onSuccess={() => setShowWorkspaceModal(false)}
            onCancel={() => setShowWorkspaceModal(false)}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowWorkspaceModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Workspace
          </Button>
          <Button onClick={() => setShowProjectModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeProjects}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Draft Projects</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draftProjects}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Archived</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.archivedProjects}</p>
            </div>
            <Folder className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          {projects.length > 6 && (
            <Button variant="ghost" size="sm">
              View All
            </Button>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div className="bg-card p-12 rounded-lg border border-border/50 text-center">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start organizing your work.
            </p>
            <Button onClick={() => setShowProjectModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="bg-card p-6 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/project/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : project.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {project.status}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Updated {formatRelativeTime(project.updatedAt)}</span>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4" />
                    <Bug className="w-4 h-4" />
                    <Settings className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Modals */}
      <Modal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        title="Create Workspace"
        size="md"
      >
        <WorkspaceForm
          onSuccess={() => setShowWorkspaceModal(false)}
          onCancel={() => setShowWorkspaceModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Create Project"
        size="lg"
      >
        <ProjectForm
          onSuccess={() => setShowProjectModal(false)}
          onCancel={() => setShowProjectModal(false)}
        />
      </Modal>
    </div>
  );
}
