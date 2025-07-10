// Location: src/components/Sidebar.tsx
// Description: Main sidebar component for RepoDock.dev - provides navigation between workspaces, projects, and global environment variables with collapsible design

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Briefcase as WorkspaceIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WorkspaceToggle } from '@/components/WorkspaceToggle';
import { ProjectList } from '@/components/ProjectList';
import { GlobalEnv } from '@/components/GlobalEnv';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  return (
    <div className={cn(
      'bg-card border-r border-border/40 flex flex-col transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <WorkspaceIcon className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">RepoDock</span>
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* Workspace Toggle */}
          <div className="py-2">
            <WorkspaceToggle isCollapsed={isCollapsed} />
          </div>

          {/* Project List */}
          {!isCollapsed && (
            <div className="py-2">
              <ProjectList />
            </div>
          )}

          {/* Global Environment */}
          {!isCollapsed && (
            <div className="py-2">
              <GlobalEnv />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border/40">
        <Button
          variant="ghost"
          className={cn(
            'w-full',
            isCollapsed ? 'justify-center px-2' : 'justify-start'
          )}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Settings</span>}
        </Button>
      </div>
    </div>
  );
}
