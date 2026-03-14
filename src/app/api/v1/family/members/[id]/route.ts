// =============================================================================
// CFO Family Finance App — Family Member Detail Route
// PATCH /api/v1/family/members/:id — Change role (OWNER only)
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { FamilyService } from '@/server/services/family.service'
import { ok, handleApiError } from '@/lib/api/response'
import { type FamilyContext, type RouteParams } from '@/server/types/api.types'
import { z } from 'zod'

const updateRoleSchema = z.object({
    role: z.enum(['ADMIN', 'MEMBER', 'CHILD']),
})

function withParams(handler: (req: NextRequest, ctx: FamilyContext, id: string) => Promise<NextResponse>) {
    return (req: NextRequest, routeParams: RouteParams) => {
        return withFamily(async (request, ctx) => {
            const { id } = await routeParams.params
            return handler(request, ctx, id)
        })(req)
    }
}

export const PATCH = withParams(async (req, ctx, memberId) => {
    try {
        const roleCheck = requireRole('OWNER')(ctx)
        if (roleCheck) return roleCheck

        const body = await req.json()
        const { role } = updateRoleSchema.parse(body)
        const result = await FamilyService.updateMemberRole(memberId, ctx.familyId, role)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})
