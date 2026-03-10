// =============================================================================
// CFO Family Finance App — Transaction Detail API Routes (GET, PATCH, DELETE)
// =============================================================================

import { type NextRequest } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { updateTransactionSchema } from '@/server/validators/transaction.schema'
import { TransactionService } from '@/server/services/transaction.service'
import { ok, noContent, handleApiError } from '@/lib/api/response'
import { type FamilyContext, type RouteParams } from '@/server/types/api.types'

function withParams(handler: (req: NextRequest, ctx: FamilyContext, id: string) => Promise<Response>) {
    return (req: NextRequest, routeParams: RouteParams) => {
        return withFamily(async (request, ctx) => {
            const { id } = await routeParams.params
            return handler(request, ctx, id) as Promise<Response & { [key: string]: unknown }>
        })(req)
    }
}

// GET /api/v1/transactions/:id
export const GET = withParams(async (_req, ctx, id) => {
    try {
        const roleCheck = requireRole('CHILD')(ctx)
        if (roleCheck) return roleCheck

        const result = await TransactionService.getById(id, ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// PATCH /api/v1/transactions/:id
export const PATCH = withParams(async (req, ctx, id) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, updateTransactionSchema)
        const result = await TransactionService.update(id, ctx.familyId, body)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// DELETE /api/v1/transactions/:id
export const DELETE = withParams(async (_req, ctx, id) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck

        await TransactionService.delete(id, ctx.familyId)
        return noContent()
    } catch (error) {
        return handleApiError(error)
    }
})
