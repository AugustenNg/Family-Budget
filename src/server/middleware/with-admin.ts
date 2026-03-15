// =============================================================================
// CFO Family Finance App — Admin Middleware
// Ensures the user is a system administrator
// =============================================================================

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export interface AdminContext {
  userId: string
  email: string
}

type AdminHandler = (
  req: NextRequest,
  ctx: AdminContext,
) => Promise<NextResponse>

export function withAdmin(handler: AdminHandler) {
  return async (req: NextRequest, routeCtx?: any) => {
    try {
      const session = await auth()

      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 },
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, isSystemAdmin: true },
      })

      if (!user?.isSystemAdmin) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
          { status: 403 },
        )
      }

      return handler(req, { userId: user.id, email: user.email })
    } catch (error) {
      console.error('[withAdmin] Error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL', message: 'Server error' } },
        { status: 500 },
      )
    }
  }
}
