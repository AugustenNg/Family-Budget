// =============================================================================
// CFO Family Finance App — Common Validation Schemas
// Shared Zod schemas for pagination, date range, sort, amount, rate
// =============================================================================

import { z } from 'zod'

// ---- Pagination ----

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// ---- Date Range ----

export const dateRangeSchema = z
    .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
    })
    .refine(
        (data) => {
            if (data.from && data.to) return data.from <= data.to
            return true
        },
        { message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' },
    )

export type DateRangeInput = z.infer<typeof dateRangeSchema>

// ---- Sort ----

export const sortSchema = z.object({
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type SortInput = z.infer<typeof sortSchema>

// ---- Amount ----

export const amountSchema = z.coerce
    .number()
    .positive('Số tiền phải lớn hơn 0')
    .max(999_999_999_999_999_999, 'Số tiền vượt quá giới hạn cho phép')

// ---- Rate (0–1) ----

export const rateSchema = z.coerce
    .number()
    .min(0, 'Tỷ lệ phải từ 0')
    .max(1, 'Tỷ lệ phải tối đa 1 (100%)')

// ---- ID ----

export const idSchema = z.string().min(1, 'ID không hợp lệ')

// ---- Optional search ----

export const searchSchema = z.string().max(200).optional()
