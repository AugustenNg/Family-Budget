// =============================================================================
// CFO Family Finance App — Route Protection Middleware
// Redirects unauthenticated users to signin for protected routes
// =============================================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedApiRoutes = ['/api/v1/']

// Routes that are always public
const publicRoutes = [
  '/auth/signin',
  '/auth/error',
  '/api/auth/',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check auth for API routes
  if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('next-auth.session-token')?.value
      || request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
  }

  // Dashboard pages: allow access (demo mode works without auth)
  // Auth is checked at the data layer via useIsApiMode()
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
}
