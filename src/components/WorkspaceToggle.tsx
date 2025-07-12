// Location: src/components/WorkspaceToggle.tsx
// Description: Workspace toggle component for RepoDock.dev - allows users to switch between workspaces, create new workspaces, and manage workspace selection with dropdown interface

'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Briefcase as WorkspaceIcon, Check, Edit, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WorkspaceForm } from '@/features/workspaces/WorkspaceForm';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/utils';
import { Workspace } from '@/types';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';

interface WorkspaceToggleProps {
  isCollapsed?: boolean;
}

export function WorkspaceToggle({ isCollapsed = false }: WorkspaceToggleProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const { workspaces, currentWorkspace, setCurrentWorkspace, deleteWorkspace } = useWorkspaces();
  const { user } = useAuth();

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setShowEditModal(true);
  };

  const handleDeleteWorkspace = async (workspace: Workspace) => {
    if (workspace.isDefault) {
      showErrorToast('Cannot Delete', 'Default workspace cannot be deleted');
      return;
    }

    if (confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      try {
        await deleteWorkspace(workspace.id);
        showSuccessToast('Workspace Deleted', `"${workspace.name}" has been deleted`);
      } catch (error) {
        showErrorToast('Delete Failed', 'Failed to delete workspace. Please try again.');
      }
    }
  };

  const getWorkspaceIcon = (workspace: Workspace) => {
    if (workspace.color) {
      return (
        <div
          className="w-4 h-4 rounded flex items-center justify-center"
          style={{ backgroundColor: workspace.color }}
        >
          <FolderOpen className="w-3 h-3 text-white" />
        </div>
      );
    }
    return <WorkspaceIcon className="w-4 h-4" />;
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-10 w-10 p-0 rounded-xl transition-all duration-200',
            'hover:bg-accent/80 hover:scale-105 active:scale-95'
          )}
          title={currentWorkspace?.name || 'Select Workspace'}
        >
          {currentWorkspace ? getWorkspaceIcon(currentWorkspace) : <WorkspaceIcon className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <span className="text-sm font-semibold text-foreground">
              Workspace
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0 rounded-lg transition-all duration-200',
              'hover:bg-blue-500/10 hover:scale-110 active:scale-95',
              'group'
            )}
            onClick={() => setShowCreateModal(true)}
            title="Create Workspace"
          >
            <Plus className="w-3.5 h-3.5 group-hover:text-blue-600 transition-colors" />
          </Button>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-between h-auto p-3 text-left rounded-xl',
                'border border-border/30 bg-card/50 backdrop-blur-sm',
                'hover:border-border/60 hover:bg-card/80 transition-all duration-200',
                'hover:shadow-sm hover:shadow-black/5'
              )}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                  {currentWorkspace ? getWorkspaceIcon(currentWorkspace) : <WorkspaceIcon className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate text-sm">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </div>
                  {currentWorkspace?.description && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {currentWorkspace.description}
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] bg-popover border border-border rounded-md shadow-md p-1 z-50"
              sideOffset={5}
            >
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="group">
                  <DropdownMenu.Item
                    className={cn(
                      'flex items-center space-x-2 px-2 py-2 text-sm rounded-sm cursor-pointer outline-none',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:bg-accent focus:text-accent-foreground',
                      currentWorkspace?.id === workspace.id && 'bg-accent'
                    )}
                    onClick={() => setCurrentWorkspace(workspace)}
                  >
                    {getWorkspaceIcon(workspace)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center space-x-1">
                        <span>{workspace.name}</span>
                        {workspace.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-1 rounded">Default</span>
                        )}
                      </div>
                      {workspace.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {workspace.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {currentWorkspace?.id === workspace.id && (
                        <Check className="w-4 h-4" />
                      )}
                      {!workspace.isDefault && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditWorkspace(workspace);
                            }}
                            title="Edit workspace"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace);
                            }}
                            title="Delete workspace"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </DropdownMenu.Item>
                </div>
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

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingWorkspace(null);
        }}
        title="Edit Workspace"
        size="md"
      >
        <WorkspaceForm
          workspace={editingWorkspace || undefined}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingWorkspace(null);
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingWorkspace(null);
          }}
        />
      </Modal>
    </>
  );
}
