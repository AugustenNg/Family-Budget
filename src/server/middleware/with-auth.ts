// =============================================================================
// CFO Family Finance App — Auth Middleware
// Verifies NextAuth session and injects userId into context
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { type AuthContext } from '@/server/types/api.types'

type AuthHandler = (
    req: NextRequest,
    ctx: AuthContext,
) => Promise<NextResponse>

/**
 * Middleware: Verify session → inject userId
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(async (req, ctx) => {
 *   // ctx.userId is available
 *   return ok({ userId: ctx.userId })
 * })
 * ```
 */
export function withAuth(handler: AuthHandler) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bạn cần đăng nhập để thực hiện hành động này',
                    },
                },
                { status: 401 },
            )
        }

        const ctx: AuthContext = {
            userId: session.user.id,
        }

        return handler(req, ctx)
    }
}
