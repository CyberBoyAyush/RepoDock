// Location: src/components/AuthGuard.tsx
// Description: Authentication guard component that prevents home page flash and handles instant redirects

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authCache } from '@/lib/cache';
import { User } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = false, 
  redirectTo = '/dashboard' 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      // Check for cached user data immediately
      const cachedUser = authCache.get<User>('current_user');
      
      // Define protected and public routes
      const publicRoutes = ['/', '/login', '/signup'];
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (cachedUser) {
        // User is authenticated
        if (isPublicRoute) {
          // Redirect authenticated users away from public routes
          router.replace(redirectTo);
          return;
        } else {
          // User is on a protected route and is authenticated
          setShouldRender(true);
          setIsChecking(false);
        }
      } else {
        // No cached user data
        if (requireAuth || !isPublicRoute) {
          // Redirect to login if auth is required or on protected route
          router.replace('/');
          return;
        } else {
          // User is on a public route and not authenticated
          setShouldRender(true);
          setIsChecking(false);
        }
      }
    };

    checkAuthAndRedirect();
  }, [pathname, requireAuth, redirectTo, router]);

  // Show loading only briefly while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render children only when we're sure about the auth state
  return shouldRender ? <>{children}</> : null;
}

// Hook for instant auth checking
export function useInstantAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check cache immediately for instant response
    const cachedUser = authCache.get<User>('current_user');
    
    if (cachedUser) {
      setUser(cachedUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  return { isAuthenticated, user };
}

// Route protection utility
export const routeProtection = {
  // Check if route requires authentication
  isProtectedRoute: (pathname: string): boolean => {
    const protectedRoutes = ['/dashboard', '/settings', '/profile'];
    return protectedRoutes.some(route => pathname.startsWith(route));
  },

  // Check if route is public only (should redirect if authenticated)
  isPublicOnlyRoute: (pathname: string): boolean => {
    const publicOnlyRoutes = ['/', '/login', '/signup'];
    return publicOnlyRoutes.includes(pathname);
  },

  // Get redirect destination based on auth state and current route
  getRedirectDestination: (
    isAuthenticated: boolean, 
    currentPath: string
  ): string | null => {
    if (isAuthenticated && routeProtection.isPublicOnlyRoute(currentPath)) {
      return '/dashboard';
    }
    
    if (!isAuthenticated && routeProtection.isProtectedRoute(currentPath)) {
      return '/';
    }
    
    return null;
  }
};

// Higher-order component for route protection
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; redirectTo?: string } = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard 
        requireAuth={options.requireAuth} 
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };
}

// Instant redirect component for immediate navigation
export function InstantRedirect({ to }: { to: string }) {
  const router = useRouter();
  
  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );
}

// Smart redirect hook that uses cache for instant decisions
export function useSmartRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  const redirectIfNeeded = () => {
    const cachedUser = authCache.get<User>('current_user');
    const redirectTo = routeProtection.getRedirectDestination(!!cachedUser, pathname);
    
    if (redirectTo) {
      router.replace(redirectTo);
      return true;
    }
    
    return false;
  };

  return { redirectIfNeeded };
}
