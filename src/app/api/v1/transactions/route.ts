// =============================================================================
// CFO Family Finance App — Transactions API Routes (GET, POST)
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { validateBody, validateQuery } from '@/server/middleware/with-validation'
import { createTransactionSchema, listTransactionsSchema } from '@/server/validators/transaction.schema'
import { TransactionService } from '@/server/services/transaction.service'
import { ok, created, handleApiError } from '@/lib/api/response'

// GET /api/v1/transactions — List (min role: CHILD)
export const GET = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('CHILD')(ctx)
        if (roleCheck) return roleCheck

        const query = validateQuery(req, listTransactionsSchema)
        const result = await TransactionService.list(ctx.familyId, query as any)
        return ok(result.data, result.meta)
    } catch (error) {
        return handleApiError(error)
    }
})

// POST /api/v1/transactions — Create (min role: MEMBER)
export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck

        const body = await validateBody(req, createTransactionSchema)
        const result = await TransactionService.create(ctx.familyId, ctx.userId, body as any)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
