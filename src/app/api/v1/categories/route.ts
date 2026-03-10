// =============================================================================
// CFO Family Finance App — Categories API Routes (GET, POST)
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { createCategorySchema } from '@/server/validators/category.schema'
import { CategoryService } from '@/server/services/category.service'
import { ok, created, handleApiError } from '@/lib/api/response'

// GET /api/v1/categories — List (min role: CHILD)
export const GET = withFamily(async (_req, ctx) => {
    try {
        const roleCheck = requireRole('CHILD')(ctx)
        if (roleCheck) return roleCheck

        const result = await CategoryService.list(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// POST /api/v1/categories — Create custom (min role: ADMIN)
export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, createCategorySchema)
        const result = await CategoryService.create(ctx.familyId, body)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
