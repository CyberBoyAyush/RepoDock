// Location: src/components/WorkspaceToggle.tsx
// Description: Workspace toggle component for RepoDock.dev - allows users to switch between workspaces, create new workspaces, and manage workspace selection with dropdown interface

'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Briefcase as WorkspaceIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WorkspaceForm } from '@/features/workspaces/WorkspaceForm';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface WorkspaceToggleProps {
  isCollapsed?: boolean;
}

export function WorkspaceToggle({ isCollapsed = false }: WorkspaceToggleProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaces();

  if (isCollapsed) {
    return (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title={currentWorkspace?.name || 'Select Workspace'}
        >
          <WorkspaceIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Workspace
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowCreateModal(true)}
            title="Create Workspace"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-2 text-left"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <WorkspaceIcon className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </div>
                  {currentWorkspace?.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {currentWorkspace.description}
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] bg-popover border border-border rounded-md shadow-md p-1 z-50"
              sideOffset={5}
            >
              {workspaces.map((workspace) => (
                <DropdownMenu.Item
                  key={workspace.id}
                  className={cn(
                    'flex items-center space-x-2 px-2 py-2 text-sm rounded-sm cursor-pointer outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    currentWorkspace?.id === workspace.id && 'bg-accent'
                  )}
                  onClick={() => setCurrentWorkspace(workspace)}
                >
                  <WorkspaceIcon className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{workspace.name}</div>
                    {workspace.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {workspace.description}
                      </div>
                    )}
                  </div>
                  {currentWorkspace?.id === workspace.id && (
                    <Check className="w-4 h-4" />
                  )}
                </DropdownMenu.Item>
              ))}

              {workspaces.length > 0 && (
                <DropdownMenu.Separator className="h-px bg-border my-1" />
              )}

              <DropdownMenu.Item
                className={cn(
                  'flex items-center space-x-2 px-2 py-2 text-sm rounded-sm cursor-pointer outline-none',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:bg-accent focus:text-accent-foreground'
                )}
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Create Workspace</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Workspace"
        size="md"
      >
        <WorkspaceForm
          onSuccess={() => setShowCreateModal(false)}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  );
}
