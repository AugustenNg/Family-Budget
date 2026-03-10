// =============================================================================
// CFO Family Finance App — Category Validation Schemas
// =============================================================================

import { z } from 'zod'

export const createCategorySchema = z.object({
    name: z.string().min(1, 'Tên danh mục không được để trống').max(100),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    icon: z.string().max(10).optional(),
    color: z.string().max(20).optional(),
    parentId: z.string().optional(),
    sortOrder: z.coerce.number().int().default(0),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    icon: z.string().max(10).optional(),
    color: z.string().max(20).optional(),
    parentId: z.string().nullable().optional(),
    sortOrder: z.coerce.number().int().optional(),
    isActive: z.boolean().optional(),
})

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
