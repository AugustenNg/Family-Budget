// =============================================================================
// CFO Family Finance App — Tags API Routes (GET, POST)
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { createTagSchema } from '@/server/validators/tag.schema'
import { TagService } from '@/server/services/tag.service'
import { ok, created, handleApiError } from '@/lib/api/response'

// GET /api/v1/tags — List
export const GET = withFamily(async (_req, ctx) => {
    try {
        const roleCheck = requireRole('CHILD')(ctx)
        if (roleCheck) return roleCheck

        const result = await TagService.list(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// POST /api/v1/tags — Create
export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, createTagSchema)
        const result = await TagService.create(ctx.familyId, body)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
