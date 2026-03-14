// =============================================================================
// CFO Family Finance App — Accounts API Routes (GET, POST)
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { createAccountSchema } from '@/server/validators/account.schema'
import { AccountService } from '@/server/services/account.service'
import { ok, created, handleApiError } from '@/lib/api/response'

// GET /api/v1/accounts — List (min role: CHILD)
export const GET = withFamily(async (_req, ctx) => {
    try {
        const roleCheck = requireRole('CHILD')(ctx)
        if (roleCheck) return roleCheck

        const result = await AccountService.list(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// POST /api/v1/accounts — Create (min role: ADMIN)
export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, createAccountSchema)
        const result = await AccountService.create(ctx.familyId, body as any)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
