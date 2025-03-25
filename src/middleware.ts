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

  // Redirect authenticated users away from signin page
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect authenticated users at root path to the dashboard
  if (isRootPath && token) {
    // Check if the URL already has a query param to avoid infinite redirects
    const url = new URL(request.url);
    if (!url.searchParams.has('dashboard')) {
      url.searchParams.set('dashboard', 'true');
      return NextResponse.redirect(url);
    }
  }

  // Redirect unauthenticated users to signin page
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
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