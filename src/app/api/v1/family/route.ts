// =============================================================================
// CFO Family Finance App — Family API Routes
// POST /api/v1/family — Create family
// =============================================================================

import { withAuth } from '@/server/middleware/with-auth'
import { FamilyService } from '@/server/services/family.service'
import { created, handleApiError } from '@/lib/api/response'
import { z } from 'zod'

const createFamilySchema = z.object({
    name: z.string().min(1, 'Tên gia đình không được để trống').max(100),
})

// POST /api/v1/family — Create (auth only, no family required)
export const POST = withAuth(async (req, ctx) => {
    try {
        const body = await req.json()
        const { name } = createFamilySchema.parse(body)
        const result = await FamilyService.create(ctx.userId, name)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
