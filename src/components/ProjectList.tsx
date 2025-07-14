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
      <div className="space-y-3">
        {/* Minimal Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Projects
          </span>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 w-6 p-0 rounded transition-colors duration-150',
              'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setShowCreateModal(true)}
            title="Create Project"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>



        {/* Minimal Project List */}
        <div className="space-y-1.5">
          {projects.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                <Folder className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                No projects yet
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="h-7 text-xs rounded"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create Project
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="space-y-1">
                {/* Minimal Project Header */}
                <div className={cn(
                  'group rounded-lg border border-border/30',
                  'hover:border-border/50 hover:bg-accent/30 transition-colors duration-150',
                  'shadow-sm shadow-black/5 dark:shadow-none hover:shadow-md dark:hover:shadow-none',
                  currentProject?.id === project.id && 'border-primary/40 bg-primary/5 shadow-primary/10'
                )}>
                  <div className="flex items-center p-2.5">
                    <button
                      onClick={() => toggleProjectExpansion(project.id)}
                      className={cn(
                        'p-0.5 hover:bg-accent rounded transition-colors duration-150'
                      )}
                    >
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>

                    <button
                      onClick={() => navigateToProject(project.id)}
                      className={cn(
                        'flex items-center space-x-2.5 flex-1 min-w-0 px-2 py-1 rounded-lg text-left',
                        'transition-all duration-150 hover:bg-accent/40',
                        currentProject?.id === project.id && 'text-primary'
                      )}
                    >
                      <Folder className={cn(
                        'w-3.5 h-3.5 flex-shrink-0',
                        currentProject?.id === project.id ? 'text-primary' : 'text-muted-foreground'
                      )} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate text-sm">{project.name}</span>
                          <div className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            project.status === 'active'
                              ? 'bg-emerald-500'
                              : project.status === 'draft'
                              ? 'bg-amber-500'
                              : project.status === 'archived'
                              ? 'bg-slate-400'
                              : 'bg-blue-500'
                          )} />
                        </div>
                        {project.description && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Minimal Project Sub-items */}
                {expandedProjects.has(project.id) && (
                  <div className="ml-5 mt-1.5 space-y-0.5">
                    <div className="grid grid-cols-2 gap-0.5">
                      <button
                        onClick={() => navigateToProject(project.id, 'details')}
                        className={cn(
                          'flex items-center space-x-1.5 px-2 py-1.5 rounded text-xs',
                          'hover:bg-accent/50 transition-colors duration-150',
                          'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => navigateToProject(project.id, 'tasks')}
                        className={cn(
                          'flex items-center space-x-1.5 px-2 py-1.5 rounded text-xs',
                          'hover:bg-accent/50 transition-colors duration-150',
                          'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <CheckSquare className="w-2.5 h-2.5" />
                        <span>Tasks</span>
                      </button>

                      <button
                        onClick={() => navigateToProject(project.id, 'pr')}
                        className={cn(
                          'flex items-center space-x-1.5 px-2 py-1.5 rounded text-xs',
                          'hover:bg-accent/50 transition-colors duration-150',
                          'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <GitPullRequest className="w-2.5 h-2.5" />
                        <span>PRs</span>
                      </button>

                      <button
                        onClick={() => navigateToProject(project.id, 'issues')}
                        className={cn(
                          'flex items-center space-x-1.5 px-2 py-1.5 rounded text-xs',
                          'hover:bg-accent/50 transition-colors duration-150',
                          'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Bug className="w-2.5 h-2.5" />
                        <span>Issues</span>
                      </button>
                    </div>

                    <button
                      onClick={() => navigateToProject(project.id, 'env')}
                      className={cn(
                        'flex items-center space-x-1.5 w-full px-2 py-1.5 rounded text-xs',
                        'hover:bg-accent/50 transition-colors duration-150',
                        'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Settings className="w-2.5 h-2.5" />
                      <span>Environment Variables</span>
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
