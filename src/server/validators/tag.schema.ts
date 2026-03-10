// =============================================================================
// CFO Family Finance App — Tag Validation Schemas
// =============================================================================

import { z } from 'zod'

export const createTagSchema = z.object({
    name: z.string().min(1, 'Tên nhãn không được để trống').max(50),
    color: z.string().max(20).optional(),
})

export type CreateTagInput = z.infer<typeof createTagSchema>

export const updateTagSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().max(20).optional(),
})

export type UpdateTagInput = z.infer<typeof updateTagSchema>
