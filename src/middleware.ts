import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  
  // Check if this is a Google auth callback URL (it might have auth parameters)
  const hasAuthParams = searchParams.has('state') || searchParams.has('code');
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/signin';
  
  // Get the token from the cookies
  const token = request.cookies.get('auth')?.value || '';

  // If we detect Google Auth callback parameters but we're not at the root path,
  // redirect to the home page to handle the auth state properly
  if (hasAuthParams && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect authenticated users away from signin page
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users to signin page
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 