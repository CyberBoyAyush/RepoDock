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
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Projects
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowCreateModal(true)}
            title="Create Project"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>



        {/* Project List */}
        <div className="space-y-1">
          {projects.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <Folder className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">
                No projects in this workspace
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create Project
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="space-y-1">
                {/* Project Header */}
                <div className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors">
                  <button
                    onClick={() => toggleProjectExpansion(project.id)}
                    className="p-0.5 hover:bg-accent rounded"
                  >
                    {expandedProjects.has(project.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  <button
                    onClick={() => navigateToProject(project.id)}
                    className={cn(
                      'flex items-center space-x-2 flex-1 text-left px-1 py-1 rounded text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      currentProject?.id === project.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground'
                    )}
                  >
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{project.name}</div>
                    </div>
                    <div className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-medium',
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : project.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    )}>
                      {project.status}
                    </div>
                  </button>
                </div>

                {/* Project Sub-items */}
                {expandedProjects.has(project.id) && (
                  <div className="ml-4 space-y-0.5 border-l border-border/30 pl-3">
                    <button
                      onClick={() => navigateToProject(project.id, 'details')}
                      className="flex items-center space-x-2 w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-accent/60 hover:text-accent-foreground transition-all duration-200 group"
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Details</span>
                    </button>

                    <button
                      onClick={() => navigateToProject(project.id, 'tasks')}
                      className="flex items-center space-x-2 w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-accent/60 hover:text-accent-foreground transition-all duration-200 group"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Tasks</span>
                    </button>

                    <button
                      onClick={() => navigateToProject(project.id, 'pr')}
                      className="flex items-center space-x-2 w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-accent/60 hover:text-accent-foreground transition-all duration-200 group"
                    >
                      <GitPullRequest className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Pull Requests</span>
                    </button>

                    <button
                      onClick={() => navigateToProject(project.id, 'issues')}
                      className="flex items-center space-x-2 w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-accent/60 hover:text-accent-foreground transition-all duration-200 group"
                    >
                      <Bug className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Issues</span>
                    </button>

                    <button
                      onClick={() => navigateToProject(project.id, 'env')}
                      className="flex items-center space-x-2 w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-accent/60 hover:text-accent-foreground transition-all duration-200 group"
                    >
                      <Settings className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Environment</span>
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
