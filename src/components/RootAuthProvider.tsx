// Location: src/components/RootAuthProvider.tsx
// Description: Root authentication provider that handles instant redirects and prevents home page flash

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authCache } from '@/lib/cache';
import { User } from '@/types';

interface RootAuthProviderProps {
  children: React.ReactNode;
}

export function RootAuthProvider({ children }: RootAuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handleInstantRedirect = () => {
      // Check for cached user data immediately
      const cachedUser = authCache.get<User>('current_user');
      
      // Define routes that should redirect authenticated users
      const publicOnlyRoutes = ['/', '/login', '/signup'];
      const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);
      
      if (cachedUser && isPublicOnlyRoute) {
        // User is authenticated and on a public-only route - redirect immediately
        router.replace('/dashboard');
        return;
      }
      
      // Allow rendering for all other cases
      setShouldRender(true);
      setIsInitialized(true);
    };

    handleInstantRedirect();
  }, [pathname, router]);

  // Don't render anything until we've checked auth state
  if (!isInitialized) {
    return null; // No loading spinner - just blank to prevent flash
  }

  // Only render children if we should
  return shouldRender ? <>{children}</> : null;
}

// Enhanced version with loading state
export function RootAuthProviderWithLoading({ children }: RootAuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleInstantRedirect = async () => {
      // Check for cached user data immediately
      const cachedUser = authCache.get<User>('current_user');
      
      // Define routes that should redirect authenticated users
      const publicOnlyRoutes = ['/', '/login', '/signup'];
      const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);
      
      if (cachedUser && isPublicOnlyRoute) {
        // User is authenticated and on a public-only route - redirect immediately
        setIsRedirecting(true);
        router.replace('/dashboard');
        return;
      }
      
      // Allow rendering for all other cases
      setShouldRender(true);
      setIsInitialized(true);
    };

    handleInstantRedirect();
  }, [pathname, router]);

  // Show minimal loading only if redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything until we've checked auth state
  if (!isInitialized) {
    return null; // No loading spinner - just blank to prevent flash
  }

  // Only render children if we should
  return shouldRender ? <>{children}</> : null;
}

// Instant redirect utility for immediate navigation
export function useInstantRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  const checkAndRedirect = () => {
    const cachedUser = authCache.get<User>('current_user');
    const publicOnlyRoutes = ['/', '/login', '/signup'];
    const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);
    
    if (cachedUser && isPublicOnlyRoute) {
      router.replace('/dashboard');
      return true;
    }
    
    return false;
  };

  return { checkAndRedirect };
}

// Hook for preventing flash of wrong content
export function usePreventFlash() {
  const [shouldShow, setShouldShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const cachedUser = authCache.get<User>('current_user');
    const publicOnlyRoutes = ['/', '/login', '/signup'];
    const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);
    
    // Only show content if:
    // 1. User is not authenticated and on public route, OR
    // 2. User is authenticated and NOT on public route
    const shouldShowContent = (!cachedUser && isPublicOnlyRoute) || (cachedUser && !isPublicOnlyRoute);
    
    setShouldShow(shouldShowContent);
  }, [pathname]);

  return shouldShow;
}
