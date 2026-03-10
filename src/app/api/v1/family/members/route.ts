// =============================================================================
// CFO Family Finance App — Family Members API Routes
// GET /api/v1/family/members — List members
// POST /api/v1/family/members — Invite member
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { FamilyService } from '@/server/services/family.service'
import { ok, created, handleApiError } from '@/lib/api/response'
import { z } from 'zod'

const inviteMemberSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    role: z.enum(['ADMIN', 'MEMBER', 'CHILD']).default('MEMBER'),
})

export const GET = withFamily(async (_req, ctx) => {
    try {
        const result = await FamilyService.getMembers(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck

        const body = await req.json()
        const { email, role } = inviteMemberSchema.parse(body)
        const result = await FamilyService.inviteMember(ctx.familyId, email, role)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
