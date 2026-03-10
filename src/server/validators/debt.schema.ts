// =============================================================================
// CFO Family Finance App — Debt Validation Schemas
// =============================================================================

import { z } from 'zod'
import { amountSchema, rateSchema } from './common.schema'

export const createDebtSchema = z.object({
    name: z.string().min(1, 'Tên khoản nợ không được để trống').max(100),
    type: z.enum(['MORTGAGE', 'CAR_LOAN', 'PERSONAL_LOAN', 'STUDENT_LOAN', 'FAMILY_DEBT', 'OTHER']),
    lenderName: z.string().max(100).optional(),
    accountId: z.string().optional(),
    originalAmount: amountSchema,
    currentBalance: amountSchema,
    interestRate: rateSchema,
    monthlyPayment: amountSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    nextDueDate: z.coerce.date().optional(),
    strategy: z.enum(['SNOWBALL', 'AVALANCHE', 'CUSTOM']).default('AVALANCHE'),
    notes: z.string().max(500).optional(),
})

export type CreateDebtInput = z.infer<typeof createDebtSchema>

export const updateDebtSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    lenderName: z.string().max(100).optional(),
    currentBalance: amountSchema.optional(),
    interestRate: rateSchema.optional(),
    monthlyPayment: amountSchema.optional(),
    nextDueDate: z.coerce.date().nullable().optional(),
    strategy: z.enum(['SNOWBALL', 'AVALANCHE', 'CUSTOM']).optional(),
    notes: z.string().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
})

export type UpdateDebtInput = z.infer<typeof updateDebtSchema>

export const createDebtPaymentSchema = z
    .object({
        paymentAmount: amountSchema,
        principalPortion: amountSchema,
        interestPortion: amountSchema,
        paymentDate: z.coerce.date(),
        notes: z.string().max(500).optional(),
    })
    .refine(
        (data) => {
            const sum = data.principalPortion + data.interestPortion
            return Math.abs(sum - data.paymentAmount) < 0.01
        },
        { message: 'Phần gốc + phần lãi phải bằng tổng thanh toán', path: ['paymentAmount'] },
    )

export type CreateDebtPaymentInput = z.infer<typeof createDebtPaymentSchema>
