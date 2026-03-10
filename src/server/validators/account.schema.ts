// =============================================================================
// CFO Family Finance App — Account Validation Schemas
// =============================================================================

import { z } from 'zod'
import { amountSchema } from './common.schema'

// ---- Create Account ----

export const createAccountSchema = z
    .object({
        name: z.string().min(1, 'Tên tài khoản không được để trống').max(100),
        type: z.enum(['CASH', 'BANK_ACCOUNT', 'CREDIT_CARD', 'SAVINGS', 'INVESTMENT', 'E_WALLET', 'LOAN']),
        currency: z.string().default('VND'),
        balance: z.coerce.number().default(0),

        // Credit card specifics
        creditLimit: z.coerce.number().positive().optional(),
        statementDay: z.coerce.number().int().min(1).max(31).optional(),
        paymentDueDays: z.coerce.number().int().min(1).max(31).optional(),
        interestRate: z.coerce.number().min(0).max(1).optional(),
        minimumPayment: z.coerce.number().min(0).optional(),
        gracePeriodDays: z.coerce.number().int().min(0).default(45),

        // Bank details
        bankName: z.string().max(100).optional(),
        accountNumber: z.string().max(20).optional(),
        branchName: z.string().max(100).optional(),

        // Display
        icon: z.string().max(10).optional(),
        color: z.string().max(20).default('#6366f1'),
        sortOrder: z.coerce.number().int().default(0),

        // Flags
        includeInTotal: z.boolean().default(true),
        isShared: z.boolean().default(false),
        notes: z.string().max(500).optional(),
    })
    .refine(
        (data) => {
            if (data.type === 'CREDIT_CARD') {
                return data.creditLimit != null && data.statementDay != null
            }
            return true
        },
        {
            message: 'Thẻ tín dụng cần có hạn mức và ngày sao kê',
            path: ['creditLimit'],
        },
    )

export type CreateAccountInput = z.infer<typeof createAccountSchema>

// ---- Update Account ----

export const updateAccountSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    currency: z.string().optional(),
    balance: z.coerce.number().optional(),
    creditLimit: z.coerce.number().positive().optional(),
    statementDay: z.coerce.number().int().min(1).max(31).optional(),
    paymentDueDays: z.coerce.number().int().min(1).max(31).optional(),
    interestRate: z.coerce.number().min(0).max(1).optional(),
    minimumPayment: z.coerce.number().min(0).optional(),
    gracePeriodDays: z.coerce.number().int().min(0).optional(),
    bankName: z.string().max(100).optional(),
    accountNumber: z.string().max(20).optional(),
    branchName: z.string().max(100).optional(),
    icon: z.string().max(10).optional(),
    color: z.string().max(20).optional(),
    sortOrder: z.coerce.number().int().optional(),
    includeInTotal: z.boolean().optional(),
    isShared: z.boolean().optional(),
    notes: z.string().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
})

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
