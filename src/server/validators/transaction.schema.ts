// =============================================================================
// CFO Family Finance App — Transaction Validation Schemas
// =============================================================================

import { z } from 'zod'
import { paginationSchema, dateRangeSchema, sortSchema, amountSchema, searchSchema } from './common.schema'

// ---- Create Transaction ----

export const createTransactionSchema = z
    .object({
        sourceAccountId: z.string().min(1, 'Vui lòng chọn tài khoản nguồn'),
        type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'CREDIT_PAYMENT', 'DEBT_PAYMENT']),
        amount: amountSchema,
        description: z.string().max(500).optional(),
        date: z.coerce.date(),
        categoryId: z.string().optional(),
        destAccountId: z.string().optional(),
        transferFee: z.coerce.number().min(0).optional(),
        tagIds: z.array(z.string()).optional(),
        location: z.string().max(200).optional(),
        isPending: z.boolean().default(false),
        isExcluded: z.boolean().default(false),
    })
    .refine(
        (data) => {
            if (data.type === 'TRANSFER') return !!data.destAccountId
            return true
        },
        { message: 'Giao dịch chuyển khoản cần chọn tài khoản đích', path: ['destAccountId'] },
    )
    .refine(
        (data) => {
            if (data.type === 'TRANSFER' && data.destAccountId) {
                return data.sourceAccountId !== data.destAccountId
            }
            return true
        },
        { message: 'Tài khoản nguồn và tài khoản đích phải khác nhau', path: ['destAccountId'] },
    )

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

// ---- Update Transaction ----

export const updateTransactionSchema = z.object({
    sourceAccountId: z.string().min(1).optional(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'CREDIT_PAYMENT', 'DEBT_PAYMENT']).optional(),
    amount: amountSchema.optional(),
    description: z.string().max(500).optional(),
    date: z.coerce.date().optional(),
    categoryId: z.string().nullable().optional(),
    destAccountId: z.string().nullable().optional(),
    transferFee: z.coerce.number().min(0).optional(),
    tagIds: z.array(z.string()).optional(),
    location: z.string().max(200).nullable().optional(),
    isPending: z.boolean().optional(),
    isExcluded: z.boolean().optional(),
})

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

// ---- List Transactions (query params) ----

export const listTransactionsSchema = paginationSchema
    .merge(dateRangeSchema.innerType())
    .merge(sortSchema)
    .extend({
        type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'CREDIT_PAYMENT', 'DEBT_PAYMENT']).optional(),
        accountId: z.string().optional(),
        categoryId: z.string().optional(),
        search: searchSchema,
        minAmount: z.coerce.number().min(0).optional(),
        maxAmount: z.coerce.number().min(0).optional(),
    })

export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>
