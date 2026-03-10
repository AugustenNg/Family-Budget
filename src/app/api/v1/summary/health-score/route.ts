// =============================================================================
// CFO Family Finance App — Health Score API Route (GET)
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { SummaryService } from '@/server/services/summary.service'
import { ok, handleApiError } from '@/lib/api/response'

// GET /api/v1/summary/health-score
export const GET = withFamily(async (_req, ctx) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck

        const result = await SummaryService.getHealthScore(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})
