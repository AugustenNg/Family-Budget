// =============================================================================
// CFO Family Finance App — Recurring Transactions API Routes
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { requireRole } from '@/server/middleware/with-role'
import { RecurringService } from '@/server/services/recurring.service'
import { ok, created, handleApiError } from '@/lib/api/response'
import { z } from 'zod'
import { amountSchema } from '@/server/validators/common.schema'

const createRecurringSchema = z.object({
    sourceAccountId: z.string().min(1),
    type: z.enum(['INCOME', 'EXPENSE']),
    amount: amountSchema,
    description: z.string().max(500).optional(),
    categoryId: z.string().optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
})

export const GET = withFamily(async (_req, ctx) => {
    try {
        const roleCheck = requireRole('MEMBER')(ctx)
        if (roleCheck) return roleCheck
        const result = await RecurringService.list(ctx.familyId)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

export const POST = withFamily(async (req, ctx) => {
    try {
        const roleCheck = requireRole('ADMIN')(ctx)
        if (roleCheck) return roleCheck
        const body = await req.json()
        const input = createRecurringSchema.parse(body)
        const result = await RecurringService.create(ctx.familyId, ctx.userId, input)
        return created(result)
    } catch (error) {
        return handleApiError(error)
    }
})
