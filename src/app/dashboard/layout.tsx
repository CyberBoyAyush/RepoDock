// Location: src/app/dashboard/layout.tsx
// Description: Dashboard layout for RepoDock.dev - provides the main dashboard structure with sidebar navigation, theme toggle, and authenticated user interface

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { useProjects } from '@/features/projects/useProjects';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import { SearchModal } from '@/components/SearchModal';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { ToastContainer } from '@/components/ui/Toast';
import { EncryptionPasswordModal, useEncryptionPasswordModal } from '@/components/EncryptionPasswordModal';
import { Search } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout, checkAuthStatus } = useAuth();
  const { loadWorkspaces, currentWorkspace } = useWorkspaces();
  const { loadProjects } = useProjects();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const { modalState, handleSubmit, closeModal } = useEncryptionPasswordModal();
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user) {
      loadWorkspaces(user.id);
    }
  }, [isAuthenticated, user, router, loadWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      loadProjects(currentWorkspace.id);
    }
  }, [currentWorkspace, loadProjects]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        onWidthChange={setSidebarWidth}
        onCollapseChange={setIsCollapsed}
      />

      {/* Main Content - with dynamic left margin for fixed sidebar */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{
          marginLeft: isDesktop ? `${isCollapsed ? 64 : sidebarWidth}px` : '0'
        }}
      >
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="h-16 px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile spacing for menu button */}
              <div className="w-8 md:w-0"></div>
              <h1 className="text-lg font-semibold hidden md:block">
                {currentWorkspace?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search Bar - Hidden on small mobile, compact on medium */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md hover:bg-muted transition-colors min-w-[120px] md:min-w-[200px] justify-start"
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Search...</span>
                <div className="ml-auto flex items-center space-x-1">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">{typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'}</span>K
                  </kbd>
                </div>
              </button>

              {/* Mobile search button */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="sm:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>

              <ThemeToggle size="sm" />

              <ProfileDropdown onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Toast Container */}
      <ToastContainer />

      {/* Encryption Password Modal */}
      <EncryptionPasswordModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        userEmail={modalState.userEmail}
      />
    </div>
  );
}
