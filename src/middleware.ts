// =============================================================================
// CFO Family Finance App — Route Protection + Security Middleware
// - Tailscale-only access (block non-Tailscale IPs in production)
// - API authentication enforcement
// - Security headers
// =============================================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Tailscale CGNAT range: 100.64.0.0/10
const TAILSCALE_PREFIX_V4 = '100.'
const TAILSCALE_PREFIX_V6 = 'fd7a:115c:a1e0:'

// Routes that are always public
const publicRoutes = [
  '/auth/signin',
  '/auth/error',
  '/api/auth/',
]

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    '127.0.0.1'
  )
}

function isTailscaleIp(ip: string): boolean {
  // Allow localhost for development
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true
  // Tailscale IPv4: 100.64.0.0/10 (100.64.x.x to 100.127.x.x)
  if (ip.startsWith(TAILSCALE_PREFIX_V4)) {
    const second = parseInt(ip.split('.')[1], 10)
    if (second >= 64 && second <= 127) return true
  }
  // Tailscale IPv6
  if (ip.startsWith(TAILSCALE_PREFIX_V6)) return true
  return false
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  // HSTS (if using HTTPS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  // Content Security Policy
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://lh3.googleusercontent.com https://*.supabase.co",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '))
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ===== TAILSCALE IP CHECK (production only) =====
  if (process.env.NODE_ENV === 'production') {
    const clientIp = getClientIp(request)
    if (!isTailscaleIp(clientIp)) {
      return new NextResponse('Forbidden — Access only via Tailscale', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      })
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

  // ===== Dashboard pages: allow (demo mode works without auth) =====
  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
}
