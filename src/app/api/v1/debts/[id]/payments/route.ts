// =============================================================================
// CFO Family Finance App — Debt Payment API Route
// POST /api/v1/debts/:id/payments
// =============================================================================

import { type NextRequest } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { createDebtPaymentSchema } from '@/server/validators/debt.schema'
import { DebtService } from '@/server/services/debt.service'
import { created, handleApiError } from '@/lib/api/response'
import { type FamilyContext, type RouteParams } from '@/server/types/api.types'

function withParams(handler: (req: NextRequest, ctx: FamilyContext, id: string) => Promise<Response>) {
    return (req: NextRequest, routeParams: RouteParams) => {
        return withFamily(async (request, ctx) => {
            const { id } = await routeParams.params
            return handler(request, ctx, id) as Promise<Response & { [key: string]: unknown }>
        })(req)
    }
}

export const POST = withParams(async (req, ctx, debtId) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck
        const body = await validateBody(req, createDebtPaymentSchema)
        const result = await DebtService.recordPayment(debtId, ctx.familyId, ctx.userId, body)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
