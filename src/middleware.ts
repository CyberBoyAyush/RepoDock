// Location: src/middleware.ts
// Description: Next.js middleware for RepoDock.dev - handles instant authentication redirects at the edge before page rendering

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Define route patterns
const publicOnlyRoutes = ['/', '/login', '/signup'];
const protectedRoutes = ['/dashboard', '/settings', '/profile'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for authentication using Better-Auth session cookie
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  // Check if current route is public-only (should redirect if authenticated)
  const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);

  // Check if current route is protected (should redirect if not authenticated)
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Redirect authenticated users away from public-only routes
  if (isAuthenticated && isPublicOnlyRoute) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && isProtectedRoute) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
