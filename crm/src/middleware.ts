import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const publicPaths = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Get the user token from cookies or localStorage (via cookie)
  // Since middleware runs on server, we need to use cookies
  const token = request.cookies.get('token')?.value;
  const hasUser = !!token;
  
  // If it's a public path and user is logged in, redirect to home page
  if (isPublicPath && hasUser) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If it's a protected path and no user is logged in, redirect to login
  if (!isPublicPath && !hasUser) {
    // Store the attempted URL for redirect after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
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
