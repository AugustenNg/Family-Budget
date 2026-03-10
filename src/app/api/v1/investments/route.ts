// =============================================================================
// CFO Family Finance App — Investments API Routes (GET, POST)
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { createInvestmentSchema } from '@/server/validators/investment.schema'
import { InvestmentService } from '@/server/services/investment.service'
import { ok, created, handleApiError } from '@/lib/api/response'

export const GET = withFamily(async (_req, ctx) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck
        const result = await InvestmentService.list(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck
        const body = await validateBody(req, createInvestmentSchema)
        const result = await InvestmentService.create(ctx.familyId, body)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
