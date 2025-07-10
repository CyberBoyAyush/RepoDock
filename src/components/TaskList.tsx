// Location: src/components/TaskList.tsx
// Description: Task list component for RepoDock.dev - displays tasks with status indicators, priority badges, and quick actions for task management within projects

'use client';


import { 
  CheckSquare, 
  Clock, 
  User, 
  Calendar, 
  MoreHorizontal,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTasks } from '@/features/tasks/useTasks';
import { Task } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

export function TaskList({ tasks, onEditTask }: TaskListProps) {
  const { updateTaskStatus, updateTaskPriority, deleteTask } = useTasks();

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

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return '🔥';
      case 'high':
        return '⚡';
      case 'medium':
        return '📋';
      case 'low':
        return '📝';
      default:
        return '📋';
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: Task['priority']) => {
    try {
      await updateTaskPriority(taskId, newPriority);
    } catch (error) {
      console.error('Failed to update task priority:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Tasks</h3>
        <p className="text-muted-foreground">
          Create your first task to start organizing your work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'p-4 rounded-lg border transition-colors',
            task.status === 'done' 
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
              : 'border-border/50 hover:border-border'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Task Header */}
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => handleStatusChange(
                    task.id, 
                    task.status === 'done' ? 'todo' : 'done'
                  )}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    task.status === 'done'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-muted-foreground hover:border-primary'
                  )}
                >
                  {task.status === 'done' && <CheckSquare className="w-3 h-3" />}
                </button>
                
                <h3 className={cn(
                  'font-medium flex-1',
                  task.status === 'done' && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </h3>

                <div className="flex items-center space-x-2">
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    <span className="mr-1">{getPriorityIcon(task.priority)}</span>
                    {task.priority}
                  </Badge>
                  
                  <Badge variant={getStatusColor(task.status)} className="text-xs">
                    {task.status === 'in-progress' ? 'In Progress' : task.status}
                  </Badge>
                </div>
              </div>

              {/* Task Description */}
              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 ml-8">
                  {task.description}
                </p>
              )}

              {/* Task Meta */}
              <div className="flex items-center space-x-4 text-xs text-muted-foreground ml-8">
                {task.assignedTo && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{task.assignedTo}</span>
                  </div>
                )}
                
                {task.dueDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(task.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Task Actions */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[160px] bg-popover border border-border rounded-md shadow-md p-1 z-50"
                  sideOffset={5}
                >
                  {/* Status submenu */}
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Change Status
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent className="min-w-[120px] bg-popover border border-border rounded-md shadow-md p-1 z-50">
                        {(['todo', 'in-progress', 'done', 'cancelled'] as const).map((status) => (
                          <DropdownMenu.Item
                            key={status}
                            className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleStatusChange(task.id, status)}
                          >
                            <Badge variant={getStatusColor(status)} className="text-xs mr-2">
                              {status === 'in-progress' ? 'In Progress' : status}
                            </Badge>
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>

                  {/* Priority submenu */}
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground">
                      <Flag className="w-4 h-4 mr-2" />
                      Change Priority
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent className="min-w-[120px] bg-popover border border-border rounded-md shadow-md p-1 z-50">
                        {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                          <DropdownMenu.Item
                            key={priority}
                            className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handlePriorityChange(task.id, priority)}
                          >
                            <Badge variant={getPriorityColor(priority)} className="text-xs mr-2">
                              <span className="mr-1">{getPriorityIcon(priority)}</span>
                              {priority}
                            </Badge>
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>

                  <DropdownMenu.Separator className="h-px bg-border my-1" />

                  <DropdownMenu.Item
                    className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onEditTask(task)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      ))}
    </div>
  );
}
