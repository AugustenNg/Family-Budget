// =============================================================================
// CFO Family Finance App — Goal Validation Schemas
// =============================================================================

import { z } from 'zod'
import { amountSchema } from './common.schema'

export const createGoalSchema = z.object({
    name: z.string().min(1, 'Tên mục tiêu không được để trống').max(100),
    targetAmount: amountSchema,
    currency: z.string().default('VND'),
    targetDate: z.coerce.date().optional(),
    icon: z.string().max(10).optional(),
    color: z.string().max(20).optional(),
    notes: z.string().max(500).optional(),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const updateGoalSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    targetAmount: amountSchema.optional(),
    targetDate: z.coerce.date().nullable().optional(),
    icon: z.string().max(10).optional(),
    color: z.string().max(20).optional(),
    notes: z.string().max(500).nullable().optional(),
})

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>

export const contributeToGoalSchema = z.object({
    amount: amountSchema,
    fromAccountId: z.string().min(1, 'Vui lòng chọn tài khoản nguồn'),
    notes: z.string().max(500).optional(),
})

export type ContributeToGoalInput = z.infer<typeof contributeToGoalSchema>
