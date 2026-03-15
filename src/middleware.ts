// =============================================================================
// CFO Family Finance App — Route Protection + Security Middleware
// - Cloudflare Tunnel verification (production)
// - API authentication enforcement
// - Security headers
// =============================================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that are always public
const publicRoutes = [
  '/auth/signin',
  '/auth/error',
  '/api/auth/',
]

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '))
  // Remove X-Powered-By to hide tech stack
  response.headers.delete('X-Powered-By')
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ===== Production: verify request comes through Cloudflare Tunnel =====
  if (process.env.NODE_ENV === 'production') {
    const cfConnecting = request.headers.get('cf-connecting-ip')
    const cfRay = request.headers.get('cf-ray')

    // If no Cloudflare headers, request is direct (bypass tunnel) — block it
    // Exception: localhost for health checks
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.ip || ''
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1'

    if (!cfConnecting && !cfRay && !isLocalhost) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // ===== Allow public routes =====
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next())
  }

  // ===== API auth check =====
  if (pathname.startsWith('/api/v1/')) {
    const token = request.cookies.get('next-auth.session-token')?.value
      || request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!token) {
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      ))
    }
  }

  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
}
