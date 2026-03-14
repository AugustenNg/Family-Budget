// =============================================================================
// CFO Family Finance App — Investment Valuation API Route
// POST /api/v1/investments/:id/valuations
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { createValuationSchema } from '@/server/validators/investment.schema'
import { InvestmentService } from '@/server/services/investment.service'
import { created, handleApiError } from '@/lib/api/response'
import { type FamilyContext, type RouteParams } from '@/server/types/api.types'

function withParams(handler: (req: NextRequest, ctx: FamilyContext, id: string) => Promise<NextResponse>) {
    return (req: NextRequest, routeParams: RouteParams) => {
        return withFamily(async (request, ctx) => {
            const { id } = await routeParams.params
            return handler(request, ctx, id)
        })(req)
    }
}

export const POST = withParams(async (req, ctx, investmentId) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck
        const body = await validateBody(req, createValuationSchema)
        const result = await InvestmentService.addValuation(investmentId, ctx.familyId, body as any)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
