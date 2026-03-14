// =============================================================================
// CFO Family Finance App — Budget Detail API Routes (PATCH, DELETE)
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { updateBudgetSchema } from '@/server/validators/budget.schema'
import { BudgetService } from '@/server/services/budget.service'
import { ok, noContent, handleApiError } from '@/lib/api/response'
import { type FamilyContext, type RouteParams } from '@/server/types/api.types'

function withParams(handler: (req: NextRequest, ctx: FamilyContext, id: string) => Promise<NextResponse>) {
    return (req: NextRequest, routeParams: RouteParams) => {
        return withFamily(async (request, ctx) => {
            const { id } = await routeParams.params
            return handler(request, ctx, id)
        })(req)
    }
}

export const PATCH = withParams(async (req, ctx, id) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck
        const body = await validateBody(req, updateBudgetSchema)
        const result = await BudgetService.update(id, ctx.familyId, body)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

export const DELETE = withParams(async (_req, ctx, id) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck
        await BudgetService.delete(id, ctx.familyId)
        return noContent()
    } catch (error) {
        return handleApiError(error)
    }
})
