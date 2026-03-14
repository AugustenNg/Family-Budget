// =============================================================================
// CFO Family Finance App — Budgets API Routes (GET, POST)
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { createBudgetSchema } from '@/server/validators/budget.schema'
import { BudgetService } from '@/server/services/budget.service'
import { ok, created, handleApiError } from '@/lib/api/response'

export const GET = withFamily(async (_req, ctx) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck
        const result = await BudgetService.list(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck
        const body = await validateBody(req, createBudgetSchema)
        const result = await BudgetService.create(ctx.familyId, body as any)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
