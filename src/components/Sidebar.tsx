// Location: src/components/Sidebar.tsx
// Description: Modern, minimal sidebar component for RepoDock.dev - provides elegant navigation between workspaces, projects, and global environment variables with enhanced UX

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Briefcase as WorkspaceIcon,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WorkspaceToggle } from '@/components/WorkspaceToggle';
import { ProjectList } from '@/components/ProjectList';
import { GlobalEnv } from '@/components/GlobalEnv';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onWidthChange?: (width: number) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onWidthChange, onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle window resize for mobile responsiveness and initial width callback
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(false); // Don't collapse on mobile, use overlay instead
      }
    };

    handleResize();
    // Call initial width callback
    onWidthChange?.(sidebarWidth);
    onCollapseChange?.(isCollapsed);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onWidthChange, onCollapseChange, sidebarWidth, isCollapsed]);

  // Handle mouse resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 400) {
        setSidebarWidth(newWidth);
        onWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  // Mobile overlay backdrop with enhanced blur effect
  const MobileBackdrop = () => (
    <div
      className={cn(
        'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300',
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={() => setIsMobileOpen(false)}
    />
  );

  return (
    <>
      {/* Enhanced Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'fixed top-4 left-4 z-[60] md:hidden h-10 w-10 p-0 rounded-xl',
          'bg-background/80 backdrop-blur-md border border-border/50',
          'hover:bg-background/90 hover:border-border transition-all duration-200',
          'shadow-lg shadow-black/5'
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      <MobileBackdrop />

      <div
        ref={sidebarRef}
        className={cn(
          // Base styles with enhanced background
          'bg-background/95 backdrop-blur-xl border-r border-border/30 flex flex-col',
          'transition-all duration-300 ease-in-out',
          // Enhanced shadow and border
          'shadow-xl shadow-black/5 dark:shadow-black/20',
          // Desktop styles - fixed positioning for full height
          'md:fixed md:left-0 md:top-0 md:h-screen md:z-40',
          isCollapsed ? 'w-16' : '',
          // Mobile styles - full overlay with proper z-index
          'fixed left-0 top-0 h-screen z-50',
          'w-80 md:w-auto', // Fixed width on mobile, auto on desktop
          // Show/hide logic for mobile and desktop
          isMobileOpen ? 'flex md:flex' : 'hidden md:flex',
          // Enhanced transform for mobile slide animation
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{
          width: isCollapsed ? '64px' : `${sidebarWidth}px`,
        }}
        data-mobile-width="320px"
      >
        {/* Enhanced Resize Handle */}
        {!isCollapsed && (
          <div
            className={cn(
              'absolute right-0 top-0 w-1 h-full cursor-col-resize transition-all duration-200 hidden md:block',
              'hover:w-1.5 hover:bg-primary/30 active:bg-primary/50',
              'before:absolute before:right-0 before:top-0 before:w-3 before:h-full before:-translate-x-1'
            )}
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Enhanced Header */}
        <div className="px-4 py-5 border-b border-border/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <button
                onClick={() => router.push('/dashboard')}
                className={cn(
                  'flex items-center space-x-3 group transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                <div className={cn(
                  'w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl',
                  'flex items-center justify-center shadow-lg shadow-primary/25',
                  'group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-200'
                )}>
                  <WorkspaceIcon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    RepoDock
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Project Manager
                  </span>
                </div>
              </button>
            )}

            {/* Enhanced Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newCollapsed = !isCollapsed;
                setIsCollapsed(newCollapsed);
                onCollapseChange?.(newCollapsed);
              }}
              className={cn(
                'h-9 w-9 p-0 hidden md:flex rounded-xl',
                'hover:bg-accent/80 hover:scale-105 active:scale-95',
                'transition-all duration-200'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>

            {/* Enhanced Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'h-9 w-9 p-0 md:hidden rounded-xl',
                'hover:bg-accent/80 transition-all duration-200'
              )}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="px-3 py-4 space-y-6">
            {/* Workspace Toggle Section */}
            <div className="space-y-2">
              <WorkspaceToggle isCollapsed={isCollapsed} />
            </div>

            {/* Project List Section */}
            {!isCollapsed && (
              <div className="space-y-2">
                <ProjectList />
              </div>
            )}

            {/* Global Environment Section */}
            {!isCollapsed && (
              <div className="space-y-2">
                <GlobalEnv />
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="px-3 py-4 border-t border-border/20 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/settings')}
            className={cn(
              'w-full justify-start h-10 px-3 rounded-xl transition-all duration-200',
              'hover:bg-accent/80 hover:scale-[1.02] active:scale-[0.98]',
              'group',
              isCollapsed && 'justify-center px-0'
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className={cn(
              'w-4 h-4 flex-shrink-0 transition-colors',
              'group-hover:text-primary'
            )} />
            {!isCollapsed && (
              <span className="ml-3 font-medium group-hover:text-primary transition-colors">
                Settings
              </span>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
