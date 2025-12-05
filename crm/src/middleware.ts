import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const publicPaths = ['/login', '/signup', '/approve'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Get the user token from cookies
  const token = request.cookies.get('token')?.value;
  const hasUser = !!token;
  
  // Get user roles from cookie
  const userRolesCookie = request.cookies.get('user_roles')?.value;
  let userRoles: string[] = [];
  if (userRolesCookie) {
    try {
      userRoles = JSON.parse(userRolesCookie);
    } catch (e) {
      console.error('Failed to parse user_roles cookie:', e);
    }
  }
  
  const hasRoles = userRoles.length > 0;
  
  // If it's a public path and user is logged in with roles, redirect to home page
  if (isPublicPath && hasUser && hasRoles) {
    // Don't redirect from /approve if user has no roles
    if (pathname.startsWith('/approve')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If it's a protected path and no user is logged in, redirect to login
  if (!isPublicPath && !hasUser) {
    // Store the attempted URL for redirect after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If user is logged in but has no roles, redirect to /approve (except for /approve itself)
  if (hasUser && !hasRoles && !pathname.startsWith('/approve')) {
    return NextResponse.redirect(new URL('/approve', request.url));
  }
  
  // If user is logged in with roles and tries to access /approve, redirect to home
  if (hasUser && hasRoles && pathname.startsWith('/approve')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
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
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
