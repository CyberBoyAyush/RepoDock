// Location: src/components/ProjectNav.tsx
// Description: Project navigation component for RepoDock.dev - provides tab navigation for project sections including Details, Tasks, Pull Requests, Issues, and Environment variables

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  CheckSquare,
  GitPullRequest,
  Bug,
  Settings,
  Info,
  ExternalLink,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { useProjects } from '@/features/projects/useProjects';
import { useTasks } from '@/features/tasks/useTasks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { TaskForm } from '@/features/tasks/TaskForm';
import { TaskList } from '@/components/TaskList';
import { ProjectEnvVariables } from '@/components/ProjectEnvVariables';
import { Task } from '@/types';


export function ProjectNav() {
  const { currentProject } = useProjects();
  const { loadTasks, getFilteredTasks, setFilter } = useTasks();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('details');

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['details', 'tasks', 'pr', 'issues', 'env'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load tasks when project changes
  useEffect(() => {
    if (currentProject) {
      loadTasks(currentProject.id);
    }
  }, [currentProject, loadTasks]);

  // Update search filter
  useEffect(() => {
    setFilter({ search: searchQuery || undefined });
  }, [searchQuery, setFilter]);

  if (!currentProject) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Info className="w-12 h-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No Project Selected</CardTitle>
          <CardDescription>Select a project from the sidebar to view its details</CardDescription>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-2xl">{currentProject.name}</CardTitle>
              <Badge variant={getStatusBadgeVariant(currentProject.status)}>
                {currentProject.status}
              </Badge>
            </div>
            {currentProject.description && (
              <CardDescription className="text-base">
                {currentProject.description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="pr" className="flex items-center space-x-2">
            <GitPullRequest className="w-4 h-4" />
            <span>Pull Requests</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center space-x-2">
            <Bug className="w-4 h-4" />
            <span>Issues</span>
          </TabsTrigger>
          <TabsTrigger value="env" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Environment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Project Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Project Information</span>
                  </CardTitle>
                  <CardDescription>
                    View and manage your project details and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Project Name</label>
                        <p className="text-lg font-semibold mt-1">{currentProject.name}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                        <div className="mt-2">
                          <Badge variant={getStatusBadgeVariant(currentProject.status)} className="text-sm">
                            {currentProject.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                        <p className="text-sm mt-2 leading-relaxed">{currentProject.description || 'No description provided'}</p>
                      </div>
                    </div>
                    {currentProject.repository && (
                      <div className="md:col-span-2 space-y-3">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Repository</label>
                          <div className="mt-2">
                            <a
                              href={currentProject.repository}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center space-x-2 font-medium"
                            >
                              <span>{currentProject.repository}</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Metadata */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</label>
                    <p className="text-sm font-medium mt-1">{new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Updated</label>
                    <p className="text-sm font-medium mt-1">{new Date(currentProject.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5" />
                    <span>Tasks</span>
                  </CardTitle>
                  <CardDescription>
                    Manage and track tasks for this project
                  </CardDescription>
                </div>
                <Button onClick={() => setShowTaskModal(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <Button variant="outline" size="sm" className="bg-background">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Task List */}
              <div className="min-h-[400px]">
                <TaskList
                  tasks={getFilteredTasks()}
                  onEditTask={(task: Task) => {
                    setEditingTask(task);
                    setShowTaskModal(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pr">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitPullRequest className="w-12 h-12 text-muted-foreground mb-4" />
              <CardTitle className="text-lg mb-2">Pull Requests</CardTitle>
              <CardDescription className="text-center mb-4">
                Pull request tracking functionality will be available in the next phase.
              </CardDescription>
              <p className="text-sm text-muted-foreground text-center">
                Coming soon: Track and manage pull requests across your repositories.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bug className="w-12 h-12 text-muted-foreground mb-4" />
              <CardTitle className="text-lg mb-2">Issue Tracking</CardTitle>
              <CardDescription className="text-center mb-4">
                Issue tracking functionality will be available in the next phase.
              </CardDescription>
              <p className="text-sm text-muted-foreground text-center">
                Coming soon: Create, categorize, and track issues with priorities and assignments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env">
          <ProjectEnvVariables projectId={currentProject.id} />
        </TabsContent>
      </Tabs>

      {/* Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <TaskForm
          task={editingTask || undefined}
          projectId={currentProject.id}
          onSuccess={() => {
            setShowTaskModal(false);
            setEditingTask(null);
            loadTasks(currentProject.id);
          }}
          onCancel={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      </Modal>
    </div>
  );

}
