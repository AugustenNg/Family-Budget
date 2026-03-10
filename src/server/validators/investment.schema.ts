// =============================================================================
// CFO Family Finance App — Investment Validation Schemas
// =============================================================================

import { z } from 'zod'
import { amountSchema, rateSchema } from './common.schema'

export const createInvestmentSchema = z.object({
    name: z.string().min(1, 'Tên khoản đầu tư không được để trống').max(100),
    symbol: z.string().max(20).optional(),
    type: z.enum(['STOCK', 'FUND', 'BOND', 'SAVINGS_TERM', 'FIXED_DEPOSIT', 'CRYPTO', 'REAL_ESTATE', 'GOLD', 'OTHER']),
    accountId: z.string().optional(),
    purchaseAmount: amountSchema,
    currentValue: amountSchema,
    quantity: z.coerce.number().min(0).optional(),
    purchasePrice: z.coerce.number().min(0).optional(),
    currency: z.string().default('VND'),
    purchaseDate: z.coerce.date(),
    maturityDate: z.coerce.date().optional(),
    interestRate: rateSchema.optional(),
    expectedReturn: z.coerce.number().min(0).optional(),
    institution: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>

export const updateInvestmentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    symbol: z.string().max(20).optional(),
    currentValue: amountSchema.optional(),
    quantity: z.coerce.number().min(0).optional(),
    interestRate: rateSchema.optional(),
    institution: z.string().max(100).optional(),
    notes: z.string().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
})

export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>

export const createValuationSchema = z.object({
    value: amountSchema,
    quantity: z.coerce.number().min(0).optional(),
    pricePerUnit: z.coerce.number().min(0).optional(),
    valuationDate: z.coerce.date(),
    source: z.string().max(50).default('manual'),
})

export type CreateValuationInput = z.infer<typeof createValuationSchema>
