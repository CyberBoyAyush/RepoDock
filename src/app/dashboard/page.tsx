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
  BarChart3,
  TrendingUp,
  Archive,
  Activity,
  Calendar,
  Users,
  Star,
  ArrowRight
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl mx-auto text-center w-full">
          <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 p-8 sm:p-12 lg:p-16 rounded-3xl border border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Welcome to RepoDock
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
                Create your first workspace to start organizing your projects and unlock the full potential of RepoDock.
              </p>
              <Button
                onClick={() => setShowWorkspaceModal(true)}
                className="group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Create Your First Workspace</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
              </Button>
            </div>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-4 md:p-8 space-y-8 md:space-y-12 max-w-7xl mx-auto">
        {/* Modern Welcome Section */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl -z-10" />

          <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 p-4 sm:p-6 lg:p-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
                    Welcome back, {user?.name || user?.username}!
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg mt-1">
                    Here's what's happening in <span className="font-medium text-foreground">{currentWorkspace.name}</span> today.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 lg:flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowWorkspaceModal(true)}
                className="group relative overflow-hidden bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 w-full sm:w-auto min-h-[44px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="w-4 h-4 mr-2 relative z-10 flex-shrink-0" />
                <span className="relative z-10 truncate">New Workspace</span>
              </Button>

              <Button
                onClick={() => setShowProjectModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto min-h-[44px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="w-4 h-4 mr-2 relative z-10 flex-shrink-0" />
                <span className="relative z-10 truncate">New Project</span>
                <ArrowRight className="w-4 h-4 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Projects Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 p-4 sm:p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  Total
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalProjects}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </div>

          {/* Active Projects Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 p-4 sm:p-6 rounded-2xl border border-border/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="text-xs font-medium text-green-700 bg-green-100/80 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                  Active
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.activeProjects}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </div>

          {/* Draft Projects Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 p-4 sm:p-6 rounded-2xl border border-border/50 hover:border-yellow-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
                <div className="text-xs font-medium text-yellow-700 bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full">
                  Draft
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.draftProjects}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Draft Projects</p>
              </div>
            </div>
          </div>

          {/* Archived Projects Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 p-4 sm:p-6 rounded-2xl border border-border/50 hover:border-muted-foreground/30 transition-all duration-300 hover:shadow-lg hover:shadow-muted-foreground/5">
            <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                </div>
                <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  Archived
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">{stats.archivedProjects}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Archived Projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Recent Projects</h2>
                <p className="text-sm text-muted-foreground hidden sm:block">Your most recently updated projects</p>
              </div>
            </div>
            {projects.length > 6 && (
              <Button variant="ghost" size="sm" className="group self-start sm:self-center">
                <span>View All</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/10 p-8 sm:p-12 rounded-3xl border border-border/50 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">No projects yet</h3>
                <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                  Create your first project to start organizing your work and unlock the full potential of RepoDock.
                </p>
                <Button
                  onClick={() => setShowProjectModal(true)}
                  className="group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Create Your First Project</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 p-4 sm:p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                  onClick={() => router.push(`/dashboard/project/${project.id}`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                          </div>
                          <h3 className="font-bold text-base sm:text-lg truncate group-hover:text-primary transition-colors duration-200">
                            {project.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
                          {project.description || 'No description provided'}
                        </p>
                      </div>

                      <div className={`ml-2 sm:ml-3 px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shadow-sm flex-shrink-0 ${
                        project.status === 'active'
                          ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200 dark:from-green-900/50 dark:to-green-900/30 dark:text-green-200 dark:border-green-800'
                          : project.status === 'draft'
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200 dark:from-yellow-900/50 dark:to-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800'
                          : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200 dark:from-gray-900/50 dark:to-gray-900/30 dark:text-gray-200 dark:border-gray-800'
                      }`}>
                        {project.status}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-muted-foreground min-w-0">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Updated {formatRelativeTime(project.updatedAt)}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 sm:space-x-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-muted/50 rounded-md flex items-center justify-center">
                          <GitBranch className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                        </div>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-muted/50 rounded-md flex items-center justify-center">
                          <Bug className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                        </div>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-muted/50 rounded-md flex items-center justify-center">
                          <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
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
    </div>
  );
}
