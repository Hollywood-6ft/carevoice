import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/signin';
  
  // Check if we're at the root path with no subpath
  const isRootPath = path === '/';

  // Get the token from the cookies
  const token = request.cookies.get('auth')?.value || '';

  // Check if URL already has query parameters to avoid redirect loops
  const url = new URL(request.url);
  const hasQueryParams = url.searchParams.toString().length > 0;

  // Redirect authenticated users away from signin page
  if (isPublicPath && token) {
    // Only redirect if not already in the process of being redirected
    if (!request.nextUrl.searchParams.has('redirected')) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('dashboard', 'true');
      redirectUrl.searchParams.set('redirected', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users at root path to the dashboard
  if (isRootPath && token && !hasQueryParams) {
    // Only add dashboard=true if there are no other query params
    url.searchParams.set('dashboard', 'true');
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to signin page
  if (!isPublicPath && !token) {
    // Only redirect if not already in the process of being redirected
    if (!request.nextUrl.searchParams.has('redirected')) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('redirected', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }
}

// Configure the paths that middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside public directory)
     * 4. /favicon.ico (inside public directory)
     */
    '/((?!api|_next|fonts|favicon.ico).*)',
  ],
}; 