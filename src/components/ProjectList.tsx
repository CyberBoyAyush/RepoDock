// Location: src/components/ProjectList.tsx
// Description: Project list component for RepoDock.dev - displays projects in the current workspace with filtering, status indicators, and quick actions for project management

'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Folder, ChevronRight, ChevronDown, FileText, CheckSquare, GitPullRequest, Bug, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProjectForm } from '@/features/projects/ProjectForm';
import { useProjects } from '@/features/projects/useProjects';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { cn } from '@/lib/utils';

export function ProjectList() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const { projects, currentProject } = useProjects();
  const { currentWorkspace } = useWorkspaces();
  const router = useRouter();

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const navigateToProject = (projectId: string, tab?: string) => {
    const url = tab ? `/dashboard/project/${projectId}?tab=${tab}` : `/dashboard/project/${projectId}`;
    router.push(url);
  };

  if (!currentWorkspace) {
    return (
      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
        Select a workspace to view projects
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <span className="text-sm font-semibold text-foreground">
              Projects
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0 rounded-lg transition-all duration-200',
              'hover:bg-primary/10 hover:scale-110 active:scale-95',
              'group'
            )}
            onClick={() => setShowCreateModal(true)}
            title="Create Project"
          >
            <Plus className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
          </Button>
        </div>



        {/* Enhanced Project List */}
        <div className="space-y-2">
          {projects.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Folder className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 font-medium">
                No projects yet
              </p>
              <p className="text-xs text-muted-foreground/80 mb-4 leading-relaxed">
                Create your first project to start organizing your work
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className={cn(
                  'h-8 text-xs rounded-lg transition-all duration-200',
                  'hover:scale-105 active:scale-95'
                )}
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Create Project
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="space-y-1">
                {/* Enhanced Project Header */}
                <div className={cn(
                  'group rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm',
                  'hover:border-border/60 hover:bg-card/80 transition-all duration-200',
                  'hover:shadow-sm hover:shadow-black/5',
                  currentProject?.id === project.id && 'border-primary/30 bg-primary/5'
                )}>
                  <div className="flex items-center p-3">
                    <button
                      onClick={() => toggleProjectExpansion(project.id)}
                      className={cn(
                        'p-1 hover:bg-accent/60 rounded-lg transition-all duration-200',
                        'hover:scale-110 active:scale-95'
                      )}
                    >
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => navigateToProject(project.id)}
                      className={cn(
                        'flex items-center space-x-3 flex-1 min-w-0 px-2 py-1 rounded-lg text-left',
                        'transition-all duration-200 hover:bg-accent/40',
                        currentProject?.id === project.id && 'text-primary'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        'bg-gradient-to-br from-muted to-muted/60',
                        currentProject?.id === project.id && 'from-primary/20 to-primary/10'
                      )}>
                        <Folder className={cn(
                          'w-4 h-4',
                          currentProject?.id === project.id ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate text-sm">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {project.description}
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                        project.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : project.status === 'draft'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
                      )}>
                        {project.status}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Enhanced Project Sub-items */}
                {expandedProjects.has(project.id) && (
                  <div className="ml-6 mt-2 space-y-1">
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => navigateToProject(project.id, 'details')}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-lg text-xs',
                          'bg-muted/30 hover:bg-muted/60 transition-all duration-200',
                          'hover:scale-[1.02] active:scale-[0.98] group'
                        )}
                      >
                        <FileText className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">Details</span>
                      </button>

                      <button
                        onClick={() => navigateToProject(project.id, 'tasks')}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-lg text-xs',
                          'bg-muted/30 hover:bg-muted/60 transition-all duration-200',
                          'hover:scale-[1.02] active:scale-[0.98] group'
                        )}
                      >
                        <CheckSquare className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">Tasks</span>
                      </button>

                      <button
                        onClick={() => navigateToProject(project.id, 'pr')}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-lg text-xs',
                          'bg-muted/30 hover:bg-muted/60 transition-all duration-200',
                          'hover:scale-[1.02] active:scale-[0.98] group'
                        )}
                      >
                        <GitPullRequest className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">PRs</span>
                      </button>

                      <button
                        onClick={() => navigateToProject(project.id, 'issues')}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-lg text-xs',
                          'bg-muted/30 hover:bg-muted/60 transition-all duration-200',
                          'hover:scale-[1.02] active:scale-[0.98] group'
                        )}
                      >
                        <Bug className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">Issues</span>
                      </button>
                    </div>

                    <button
                      onClick={() => navigateToProject(project.id, 'env')}
                      className={cn(
                        'flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-xs',
                        'bg-muted/30 hover:bg-muted/60 transition-all duration-200',
                        'hover:scale-[1.02] active:scale-[0.98] group'
                      )}
                    >
                      <Settings className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium">Environment Variables</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Show more button if there are many projects */}
        {projects.length > 10 && (
          <div className="px-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
            >
              Show All ({projects.length})
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Project"
        size="lg"
      >
        <ProjectForm
          onSuccess={() => setShowCreateModal(false)}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  );
}
