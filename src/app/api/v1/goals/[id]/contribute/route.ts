// =============================================================================
// CFO Family Finance App — Goal Contribute API Route
// POST /api/v1/goals/:id/contribute
// =============================================================================

import { type NextRequest } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { contributeToGoalSchema } from '@/server/validators/goal.schema'
import { GoalService } from '@/server/services/goal.service'
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

export const POST = withParams(async (req, ctx, goalId) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck
        const body = await validateBody(req, contributeToGoalSchema)
        const result = await GoalService.contribute(goalId, ctx.familyId, ctx.userId, body)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})
