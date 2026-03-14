// =============================================================================
// CFO Family Finance App — Tag Detail API Routes (PATCH, DELETE)
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { updateTagSchema } from '@/server/validators/tag.schema'
import { TagService } from '@/server/services/tag.service'
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

// PATCH /api/v1/tags/:id
export const PATCH = withParams(async (req, ctx, id) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, updateTagSchema)
        const result = await TagService.update(id, ctx.familyId, body)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// DELETE /api/v1/tags/:id
export const DELETE = withParams(async (_req, ctx, id) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck

        await TagService.delete(id, ctx.familyId)
        return noContent()
    } catch (error) {
        return handleApiError(error)
    }
})
