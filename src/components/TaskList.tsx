// Location: src/components/TaskList.tsx
// Description: Task list component for RepoDock.dev - displays tasks with status indicators, priority badges, and quick actions for task management within projects

'use client';


import {
  CheckSquare,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  const { updateTaskStatus, deleteTask } = useTasks();

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
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
      <div className="text-center py-8 md:py-12">
        <div className="p-6 bg-gradient-to-br from-muted/60 to-muted/90 rounded-2xl border border-border inline-block mb-6 shadow-lg">
          <CheckSquare className="w-10 h-10 md:w-12 md:h-12 text-foreground/60" />
        </div>
        <h3 className="text-base md:text-lg font-semibold mb-2 text-foreground">No Tasks Yet</h3>
        <p className="text-sm md:text-base text-foreground/70 max-w-sm mx-auto leading-relaxed">
          Create your first task to start organizing your work and tracking progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'group p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 hover:border-border hover:shadow-lg transition-all duration-200 shadow-md',
            task.status === 'done' && 'opacity-60'
          )}
        >
          <div className="flex items-center space-x-3">
            {/* Minimal Checkbox */}
            <button
              onClick={() => handleStatusChange(
                task.id,
                task.status === 'done' ? 'todo' : 'done'
              )}
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0',
                task.status === 'done'
                  ? 'bg-green-500 border-green-500 text-white shadow-md'
                  : 'border-foreground/30 hover:border-primary hover:bg-primary/20 bg-background shadow-md hover:shadow-lg'
              )}
            >
              {task.status === 'done' && <CheckSquare className="w-3 h-3" />}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    'font-semibold text-sm leading-tight text-foreground',
                    task.status === 'done' && 'line-through text-muted-foreground'
                  )}>
                    {task.title}
                  </h3>

                  {/* Minimal Description */}
                  {task.description && (
                    <p className="text-xs text-foreground/70 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  {/* Minimal Meta */}
                  <div className="flex items-center space-x-3 text-xs text-foreground/60 mt-1">
                    {task.assignedTo && (
                      <span className="font-medium">{task.assignedTo}</span>
                    )}

                    {task.dueDate && (
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    )}

                    <span>{formatRelativeTime(task.updatedAt)}</span>
                  </div>
                </div>

                {/* Minimal Status Indicator */}
                <div className="flex items-center space-x-2 ml-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full shadow-md border border-background',
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' :
                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-foreground/40'
                  )} />

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[160px] bg-popover border border-border rounded-md shadow-md p-1 z-50"
                        sideOffset={5}
                      >
                        <DropdownMenu.Item
                          className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground"
                          onClick={() => onEditTask(task)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          className="flex items-center px-2 py-2 text-sm rounded-sm cursor-pointer outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
