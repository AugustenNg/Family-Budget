// =============================================================================
// CFO Family Finance App — Category Detail API Routes (PATCH, DELETE)
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody } from '@/server/middleware/with-validation'
import { updateCategorySchema } from '@/server/validators/category.schema'
import { CategoryService } from '@/server/services/category.service'
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

// PATCH /api/v1/categories/:id (min ADMIN)
export const PATCH = withParams(async (req, ctx, id) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, updateCategorySchema)
        const result = await CategoryService.update(id, body)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// DELETE /api/v1/categories/:id (min ADMIN)
export const DELETE = withParams(async (_req, ctx, id) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck

        await CategoryService.delete(id)
        return noContent()
    } catch (error) {
        return handleApiError(error)
    }
})
