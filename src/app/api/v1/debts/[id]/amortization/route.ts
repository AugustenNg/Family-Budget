// =============================================================================
// CFO Family Finance App — Debt Amortization API Route
// GET /api/v1/debts/:id/amortization
// =============================================================================

import { type NextRequest } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { DebtService } from '@/server/services/debt.service'
import { ok, handleApiError } from '@/lib/api/response'
import { type FamilyContext, type RouteParams } from '@/server/types/api.types'

function withParams(handler: (req: NextRequest, ctx: FamilyContext, id: string) => Promise<Response>) {
    return (req: NextRequest, routeParams: RouteParams) => {
        return withFamily(async (request, ctx) => {
            const { id } = await routeParams.params
            return handler(request, ctx, id) as Promise<Response & { [key: string]: unknown }>
        })(req)
    }
}

export const GET = withParams(async (_req, ctx, debtId) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck
        const result = await DebtService.getAmortization(debtId, ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})
