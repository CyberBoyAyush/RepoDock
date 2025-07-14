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
  const [sidebarWidth, setSidebarWidth] = useState(240); // Default width in pixels
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

  // Mobile overlay backdrop
  const MobileBackdrop = () => (
    <div
      className={cn(
        'fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-200',
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={() => setIsMobileOpen(false)}
    />
  );

  return (
    <>
      {/* Minimal Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'fixed top-4 left-4 z-[60] md:hidden h-9 w-9 p-0 rounded-lg',
          'bg-background/95 backdrop-blur-sm border border-border/40',
          'hover:bg-accent shadow-sm shadow-black/5 dark:shadow-none',
          'transition-colors duration-150'
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      <MobileBackdrop />

      <div
        ref={sidebarRef}
        className={cn(
          // Base styles - enhanced for light mode
          'bg-background/95 backdrop-blur-sm border-r border-border/30 flex flex-col',
          'transition-all duration-200 ease-out',
          // Light mode enhancement
          'shadow-sm shadow-black/5 dark:shadow-none',
          // Desktop styles - fixed positioning for full height
          'md:fixed md:left-0 md:top-0 md:h-screen md:z-40',
          isCollapsed ? 'w-14' : '',
          // Mobile styles - full overlay with proper z-index
          'fixed left-0 top-0 h-screen z-50',
          'w-72 md:w-auto', // Slightly narrower on mobile
          // Show/hide logic for mobile and desktop
          isMobileOpen ? 'flex md:flex' : 'hidden md:flex',
          // Transform for mobile slide animation
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{
          width: isCollapsed ? '56px' : `${sidebarWidth}px`,
        }}
        data-mobile-width="288px"
      >
        {/* Minimal Resize Handle */}
        {!isCollapsed && (
          <div
            className={cn(
              'absolute right-0 top-0 w-0.5 h-full cursor-col-resize transition-colors duration-150 hidden md:block',
              'hover:w-1 hover:bg-border',
              'before:absolute before:right-0 before:top-0 before:w-2 before:h-full before:-translate-x-0.5'
            )}
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Minimal Header */}
        <div className="px-4 py-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <button
                onClick={() => router.push('/dashboard')}
                className={cn(
                  'flex items-center space-x-2.5 group transition-colors duration-150'
                )}
              >
                <div className={cn(
                  'w-6 h-6 bg-primary rounded-lg flex items-center justify-center'
                )}>
                  <WorkspaceIcon className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    RepoDock
                  </span>
                </div>
              </button>
            )}

            {/* Minimal Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newCollapsed = !isCollapsed;
                setIsCollapsed(newCollapsed);
                onCollapseChange?.(newCollapsed);
              }}
              className={cn(
                'h-8 w-8 p-0 hidden md:flex rounded-lg',
                'hover:bg-accent transition-colors duration-150'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </Button>

            {/* Minimal Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'h-8 w-8 p-0 md:hidden rounded-lg',
                'hover:bg-accent transition-colors duration-150'
              )}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Minimal Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-3 py-3 space-y-4">
            {/* Workspace Toggle Section */}
            <div>
              <WorkspaceToggle isCollapsed={isCollapsed} />
            </div>

            {/* Project List Section */}
            {!isCollapsed && (
              <div>
                <ProjectList />
              </div>
            )}

            {/* Global Environment Section */}
            {!isCollapsed && (
              <div>
                <GlobalEnv />
              </div>
            )}
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="px-3 py-3 border-t border-border/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/settings')}
            className={cn(
              'w-full justify-start h-9 px-2.5 rounded-lg transition-colors duration-150',
              'hover:bg-accent text-muted-foreground hover:text-foreground',
              isCollapsed && 'justify-center px-0'
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="ml-2.5 text-sm">
                Settings
              </span>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
