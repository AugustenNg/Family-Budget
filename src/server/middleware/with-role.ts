// =============================================================================
// CFO Family Finance App — Role-Based Access Control Middleware
// Checks user's role against minimum required role
// =============================================================================

import { NextResponse } from 'next/server'
import { type FamilyRole } from '@prisma/client'
import { type FamilyContext } from '@/server/types/api.types'

/**
 * Role hierarchy: OWNER > ADMIN > MEMBER > CHILD
 * A higher value means more permissions.
 */
const ROLE_HIERARCHY: Record<FamilyRole, number> = {
    CHILD: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
}

/**
 * Check if the user's role meets the minimum required role.
 *
 * Returns `null` if the check passes, or a 403 NextResponse if it fails.
 *
 * Usage inside a withFamily handler:
 * ```ts
 * export const POST = withFamily(async (req, ctx) => {
 *   const roleCheck = requireRole('ADMIN')(ctx)
 *   if (roleCheck) return roleCheck
 *   // ... proceed
 * })
 * ```
 */
export function requireRole(minimumRole: FamilyRole) {
    return (ctx: FamilyContext): NextResponse | null => {
        const userLevel = ROLE_HIERARCHY[ctx.role]
        const requiredLevel = ROLE_HIERARCHY[minimumRole]

        if (userLevel < requiredLevel) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: `Yêu cầu quyền ${minimumRole} trở lên. Quyền hiện tại: ${ctx.role}`,
                    },
                },
                { status: 403 },
            )
        }

        return null // Passed
    }
}
