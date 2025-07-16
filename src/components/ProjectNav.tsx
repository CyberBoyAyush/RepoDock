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
  Search,
  Calendar,
  GitBranch
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
import { PullRequestList } from '@/components/PullRequestList';
import { IssueList } from '@/components/IssueList';
import { RepositoryConnection } from '@/components/RepositoryConnection';
import { GitHubConnectionStatus } from '@/components/GitHubConnectionStatus';
import { Task } from '@/types';
import { formatRelativeTime } from '@/lib/utils';


export function ProjectNav() {
  const { currentProject, setCurrentProject } = useProjects();
  const { loadTasks, getFilteredTasks, setFilter } = useTasks();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('details');

  // Helper functions
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'cancelled':
        return 'destructive';
      case 'todo':
        return 'secondary';
      default:
        return 'default';
    }
  };

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
      {/* Compact Project Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-accent/3 rounded-xl"></div>
        <Card className="relative border-border/30 shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/15 rounded-lg shadow-sm">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-bold text-foreground truncate">
                      {currentProject.name}
                    </h1>
                    <Badge
                      variant={getStatusBadgeVariant(currentProject.status)}
                      className="px-2 py-1 text-xs font-medium"
                    >
                      {currentProject.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    {currentProject.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {currentProject.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created {new Date(currentProject.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span>•</span>
                      <span>Updated {formatRelativeTime(currentProject.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {currentProject.repository && (
                  <a
                    href={currentProject.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted/70 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm"
                  >
                    <span>Repo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {getFilteredTasks().length} tasks
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-muted/10 to-background rounded-2xl"></div>
          <TabsList className="relative grid w-full grid-cols-5 h-auto p-2 bg-muted/30 backdrop-blur-sm border border-border/40 shadow-lg">
            <TabsTrigger
              value="details"
              className="flex items-center justify-center space-x-1 md:space-x-2 px-2 md:px-4 py-3 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex items-center justify-center space-x-1 md:space-x-2 px-2 md:px-4 py-3 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              <CheckSquare className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger
              value="pr"
              className="flex items-center justify-center space-x-1 md:space-x-2 px-1 md:px-4 py-3 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              <GitPullRequest className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Pull Requests</span>
              <span className="hidden sm:inline md:hidden">PRs</span>
            </TabsTrigger>
            <TabsTrigger
              value="issues"
              className="flex items-center justify-center space-x-1 md:space-x-2 px-2 md:px-4 py-3 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              <Bug className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Issues</span>
            </TabsTrigger>
            <TabsTrigger
              value="env"
              className="flex items-center justify-center space-x-1 md:space-x-2 px-1 md:px-4 py-3 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Environment</span>
              <span className="hidden sm:inline md:hidden">Env</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details">
          <div className="space-y-6">

            {/* Enhanced Dashboard Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Tasks Stats */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Card className="relative border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300">
                            <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tasks</p>
                            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                              {getFilteredTasks().length}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                              <span className="text-xs text-muted-foreground font-medium">Completed</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-600">
                              {getFilteredTasks().filter(t => t.status === 'done').length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                              <span className="text-xs text-muted-foreground font-medium">In Progress</span>
                            </div>
                            <span className="text-xs font-bold text-blue-600">
                              {getFilteredTasks().filter(t => t.status === 'in-progress').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pull Requests Stats */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Card className="relative border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300">
                            <GitPullRequest className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pull Requests</p>
                            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">0</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-muted-foreground/40 rounded-full"></div>
                              <span className="text-xs text-muted-foreground font-medium">Coming Soon</span>
                            </div>
                            <span className="text-xs font-bold text-purple-600">-</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Issues Stats */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Card className="relative border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300">
                            <Bug className="w-6 h-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Issues</p>
                            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">0</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-muted-foreground/40 rounded-full"></div>
                              <span className="text-xs text-muted-foreground font-medium">Coming Soon</span>
                            </div>
                            <span className="text-xs font-bold text-red-600">-</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Environment Variables Stats */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Card className="relative border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300">
                            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Environment</p>
                            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">-</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                              <span className="text-xs text-muted-foreground font-medium">Variables</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-600">Secure</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Tasks */}
              <div className="lg:col-span-2">
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg md:text-xl flex items-center space-x-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl shadow-sm">
                          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Recent Activity</span>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('tasks')}
                        className="text-xs md:text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        View All Tasks
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getFilteredTasks().length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/50 rounded-2xl inline-block mb-6 border border-border/20">
                          <CheckSquare className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">No Tasks Yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                          Start organizing your work by creating your first task
                        </p>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
                          onClick={() => setShowTaskModal(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Task
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {getFilteredTasks().slice(0, 4).map((task, index) => (
                            <div
                              key={task.id}
                              className="group p-4 bg-gradient-to-r from-background to-muted/20 rounded-xl border border-border/30 hover:border-border/60 hover:shadow-sm transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-muted-foreground w-4">#{index + 1}</span>
                                    <div className={`w-3 h-3 rounded-full shadow-sm ${
                                      task.status === 'done' ? 'bg-emerald-500' :
                                      task.status === 'in-progress' ? 'bg-blue-500' :
                                      task.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                                    }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                                      {task.title}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-xs text-muted-foreground font-medium">
                                        {task.priority} priority
                                      </span>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatRelativeTime(task.updatedAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant={getStatusColor(task.status)} className="text-xs font-medium">
                                  {task.status === 'in-progress' ? 'Active' : task.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                        {getFilteredTasks().length > 4 && (
                          <div className="text-center pt-4 border-t border-border/30">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab('tasks')}
                              className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                              View {getFilteredTasks().length - 4} more tasks →
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Project Info Sidebar */}
              <div className="space-y-6">
                {/* Project Timeline */}
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg flex items-center space-x-3">
                      <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl shadow-sm">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>Project Timeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                          <div className="w-px h-6 bg-border mt-2"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-semibold text-foreground">Project Created</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                              weekday: 'long'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Last Updated</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(currentProject.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg flex items-center space-x-3">
                      <div className="p-2.5 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl shadow-sm">
                        <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 text-blue-700 dark:text-blue-300"
                      variant="outline"
                      onClick={() => setShowTaskModal(true)}
                    >
                      <CheckSquare className="w-4 h-4 mr-3" />
                      Create New Task
                    </Button>
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 text-emerald-700 dark:text-emerald-300"
                      variant="outline"
                      onClick={() => setActiveTab('env')}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Environment Variables
                    </Button>
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 text-purple-700 dark:text-purple-300"
                      variant="outline"
                      onClick={() => setActiveTab('pr')}
                    >
                      <GitPullRequest className="w-4 h-4 mr-3" />
                      Pull Requests
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* GitHub Integration Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/40 dark:to-gray-800/40 rounded-xl shadow-sm">
                  <GitBranch className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">GitHub Integration</h2>
                  <p className="text-sm text-muted-foreground">Connect your repository and manage GitHub App installation</p>
                </div>
              </div>

              {currentProject && (
                <RepositoryConnection
                  project={currentProject}
                  onUpdate={async (updates) => {
                    try {
                      const response = await fetch(`/api/projects/${currentProject.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updates),
                      });

                      if (response.ok) {
                        // Update local project state
                        if (currentProject) {
                          setCurrentProject({ ...currentProject, ...updates });
                        }
                      }
                    } catch (error) {
                      // Silent error handling
                    }
                  }}
                />
              )}

              {/* GitHub App Installation Status */}
              <GitHubConnectionStatus />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="space-y-8">
            {/* Enhanced Header */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl"></div>
              <Card className="relative border-border/40 shadow-lg backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="space-y-2">
                      <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Tasks Management
                      </h2>
                      <p className="text-sm lg:text-base text-muted-foreground">
                        {getFilteredTasks().length} total tasks • {getFilteredTasks().filter(t => t.status === 'done').length} completed • {getFilteredTasks().filter(t => t.status === 'in-progress').length} in progress
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowTaskModal(true)}
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create New Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{getFilteredTasks().length}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tasks</div>
                </CardContent>
              </Card>
              <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-1">{getFilteredTasks().filter(t => t.status === 'in-progress').length}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Progress</div>
                </CardContent>
              </Card>
              <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-emerald-600 mb-1">{getFilteredTasks().filter(t => t.status === 'done').length}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</div>
                </CardContent>
              </Card>
              <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-amber-600 mb-1">{getFilteredTasks().filter(t => t.status === 'todo').length}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Do</div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Search */}
            <Card className="border-border/40 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks by title, description, or assignee..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-3 border-border/40 bg-background focus:bg-muted/20 transition-all duration-200 text-base"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-border/40 hover:bg-muted/50 transition-all duration-200"
                  >
                    <Filter className="w-5 h-5 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Clean Task List */}
            <div className="space-y-1">
              <TaskList
                tasks={getFilteredTasks()}
                onEditTask={(task: Task) => {
                  setEditingTask(task);
                  setShowTaskModal(true);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pr">
          <div className="space-y-6">
            {currentProject && <PullRequestList projectId={currentProject.id} />}
          </div>
        </TabsContent>

        <TabsContent value="issues">
          {currentProject && <IssueList projectId={currentProject.id} />}
        </TabsContent>

        <TabsContent value="env">
          <div className="space-y-6">
            {/* Environment Header */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-3 text-xl md:text-2xl">
                      <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl shadow-sm">
                        <Settings className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>Environment Variables</span>
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base mt-2">
                      Securely manage environment variables for this project with AES-256 encryption
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Encrypted Storage</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Environment Variables Component */}
            <div className="bg-gradient-to-b from-background to-muted/10 rounded-xl border border-border/30 p-1">
              <ProjectEnvVariables projectId={currentProject.id} />
            </div>
          </div>
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
