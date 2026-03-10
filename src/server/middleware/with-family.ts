// =============================================================================
// CFO Family Finance App — Family Context Middleware
// Verifies session + looks up family membership → injects familyId + role
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type FamilyContext } from '@/server/types/api.types'

type FamilyHandler = (
    req: NextRequest,
    ctx: FamilyContext,
) => Promise<NextResponse>

/**
 * Middleware: Session check + family membership lookup → inject familyId + role
 *
 * Combines withAuth functionality with family context.
 * Looks up the user's ACTIVE family membership and injects familyId + role.
 *
 * Usage:
 * ```ts
 * export const GET = withFamily(async (req, ctx) => {
 *   // ctx.userId, ctx.familyId, ctx.role are available
 *   return ok({ familyId: ctx.familyId })
 * })
 * ```
 */
export function withFamily(handler: FamilyHandler) {
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

        const userId = session.user.id

        // Look up user's active family membership
        const membership = await prisma.familyMember.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
            },
            select: {
                familyId: true,
                role: true,
            },
        })

        if (!membership) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Bạn chưa thuộc gia đình nào. Vui lòng tạo hoặc tham gia một gia đình.',
                    },
                },
                { status: 403 },
            )
        }

        const ctx: FamilyContext = {
            userId,
            familyId: membership.familyId,
            role: membership.role,
        }

        return handler(req, ctx)
    }
}
