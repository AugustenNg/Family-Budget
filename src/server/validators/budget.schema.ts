// =============================================================================
// CFO Family Finance App — Budget Validation Schemas
// =============================================================================

import { z } from 'zod'
import { amountSchema } from './common.schema'

export const createBudgetSchema = z
    .object({
        categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
        amount: amountSchema,
        currency: z.string().default('VND'),
        periodStart: z.coerce.date(),
        periodEnd: z.coerce.date(),
        rollover: z.boolean().default(false),
        alertThresholds: z.array(z.coerce.number().int().min(1).max(200)).default([50, 80, 100]),
        notes: z.string().max(500).optional(),
    })
    .refine(
        (data) => data.periodStart < data.periodEnd,
        { message: 'Ngày bắt đầu phải trước ngày kết thúc', path: ['periodStart'] },
    )

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>

export const updateBudgetSchema = z.object({
    amount: amountSchema.optional(),
    periodStart: z.coerce.date().optional(),
    periodEnd: z.coerce.date().optional(),
    rollover: z.boolean().optional(),
    notes: z.string().max(500).nullable().optional(),
})

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
