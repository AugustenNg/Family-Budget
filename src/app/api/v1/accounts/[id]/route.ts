// =============================================================================
// CFO Family Finance App — Account Detail API Routes (GET, PATCH, DELETE)
// =============================================================================

import { type NextRequest } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { updateAccountSchema } from '@/server/validators/account.schema'
import { AccountService } from '@/server/services/account.service'
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

// GET /api/v1/accounts/:id
export const GET = withParams(async (_req, ctx, id) => {
    try {
        const result = await AccountService.getById(id, ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// PATCH /api/v1/accounts/:id — (min role: ADMIN)
export const PATCH = withParams(async (req, ctx, id) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, updateAccountSchema)
        const result = await AccountService.update(id, ctx.familyId, body)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// DELETE /api/v1/accounts/:id — Soft delete (min role: OWNER)
export const DELETE = withParams(async (_req, ctx, id) => {
    try {
        const roleCheck = requireRole('OWNER')(ctx)
        if (roleCheck) return roleCheck

        await AccountService.softDelete(id, ctx.familyId)
        return noContent()
    } catch (error) {
        return handleApiError(error)
    }
})
