// Location: src/components/AppPreloader.tsx
// Description: App preloader component for RepoDock.dev - provides instant UI with cached data while fresh data loads in background

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { useProjects } from '@/features/projects/useProjects';
import { authCache, dataCache, cacheUtils } from '@/lib/cache';
import { User, Workspace, Project } from '@/types';

interface AppPreloaderProps {
  children: React.ReactNode;
}

export function AppPreloader({ children }: AppPreloaderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isAuthenticated, checkAuthStatus } = useAuth();
  const { loadWorkspaces, currentWorkspace } = useWorkspaces();
  const { loadProjects } = useProjects();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Check for cached user data first for instant UI
        const cachedUser = authCache.get<User>('current_user');
        
        if (cachedUser) {
          // We have cached user, show UI immediately
          setIsInitialized(true);
          
          // Load cached workspaces and projects for instant display
          const cachedWorkspaces = dataCache.get<Workspace[]>(
            cacheUtils.workspacesKey(cachedUser.id)
          );
          
          if (cachedWorkspaces && cachedWorkspaces.length > 0) {
            const defaultWorkspace = cachedWorkspaces.find(w => w.isDefault) || cachedWorkspaces[0];
            
            // Load cached projects for the default workspace
            const cachedProjects = dataCache.get<Project[]>(
              cacheUtils.projectsKey(defaultWorkspace.id)
            );
            
            // All cached data loaded, now verify session in background
            checkAuthStatus().then(() => {
              // After auth verification, load fresh data if user is still authenticated
              if (user) {
                loadWorkspaces(user.id);
                if (currentWorkspace) {
                  loadProjects(currentWorkspace.id);
                }
              }
            });
          } else {
            // No cached workspaces, need to load them
            checkAuthStatus().then(() => {
              if (user) {
                loadWorkspaces(user.id);
              }
            });
          }
        } else {
          // No cached user, do normal auth check
          await checkAuthStatus();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Load projects when workspace changes
  useEffect(() => {
    if (isAuthenticated && user && currentWorkspace) {
      loadProjects(currentWorkspace.id);
    }
  }, [currentWorkspace, isAuthenticated, user, loadProjects]);

  // Show loading only if we have no cached data and are not initialized
  if (!isInitialized && !authCache.get<User>('current_user')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading RepoDock...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for checking if app has cached data available
export function useHasCachedData() {
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    const cachedUser = authCache.get<User>('current_user');
    if (cachedUser) {
      const cachedWorkspaces = dataCache.get<Workspace[]>(
        cacheUtils.workspacesKey(cachedUser.id)
      );
      setHasCachedData(!!cachedWorkspaces);
    }
  }, []);

  return hasCachedData;
}

// Hook for preloading data
export function useDataPreloader() {
  const { user } = useAuth();
  const { loadWorkspaces } = useWorkspaces();
  const { loadProjects } = useProjects();

  const preloadUserData = async (userId: string) => {
    try {
      // Preload workspaces
      await loadWorkspaces(userId);
      
      // Get default workspace and preload its projects
      const cachedWorkspaces = dataCache.get<Workspace[]>(
        cacheUtils.workspacesKey(userId)
      );
      
      if (cachedWorkspaces && cachedWorkspaces.length > 0) {
        const defaultWorkspace = cachedWorkspaces.find(w => w.isDefault) || cachedWorkspaces[0];
        await loadProjects(defaultWorkspace.id);
      }
    } catch (error) {
      console.error('Data preloading error:', error);
    }
  };

  return { preloadUserData };
}

// Cache warming utility
export const cacheWarmer = {
  // Warm up cache with essential data
  warmEssentialData: async (userId: string) => {
    try {
      // Fetch and cache workspaces
      const workspacesResponse = await fetch('/api/workspaces');
      if (workspacesResponse.ok) {
        const { workspaces } = await workspacesResponse.json();
        dataCache.set(cacheUtils.workspacesKey(userId), workspaces);
        
        // If we have workspaces, cache projects for the default one
        if (workspaces.length > 0) {
          const defaultWorkspace = workspaces.find((w: Workspace) => w.isDefault) || workspaces[0];
          
          const projectsResponse = await fetch(`/api/projects?workspaceId=${defaultWorkspace.id}`);
          if (projectsResponse.ok) {
            const { projects } = await projectsResponse.json();
            dataCache.set(cacheUtils.projectsKey(defaultWorkspace.id), projects);
          }
        }
      }
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  },

  // Warm cache on user login
  warmOnLogin: async (user: User) => {
    // Cache user data
    authCache.set('current_user', user);
    
    // Warm essential data in background
    setTimeout(() => {
      cacheWarmer.warmEssentialData(user.id);
    }, 100);
  }
};
