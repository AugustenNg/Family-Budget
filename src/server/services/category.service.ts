// =============================================================================
// CFO Family Finance App — Category Service
// =============================================================================

import { AppError } from '@/server/errors/app-error'
import { CategoryRepo } from '@/server/repositories/category.repo'
import { type CreateCategoryInput, type UpdateCategoryInput } from '@/server/validators/category.schema'

export class CategoryService {
    static async list(familyId: string) {
        return CategoryRepo.findMany(familyId)
    }

    static async getById(id: string) {
        const category = await CategoryRepo.findById(id)
        if (!category) throw AppError.notFound('Danh mục')
        return category
    }

    static async create(familyId: string, input: CreateCategoryInput) {
        return CategoryRepo.create({
            name: input.name,
            type: input.type,
            icon: input.icon,
            color: input.color,
            sortOrder: input.sortOrder,
            family: { connect: { id: familyId } },
            ...(input.parentId && { parent: { connect: { id: input.parentId } } }),
        })
    }

    static async update(id: string, input: UpdateCategoryInput) {
        const existing = await CategoryRepo.findById(id)
        if (!existing) throw AppError.notFound('Danh mục')

        // Prevent editing system categories
        if (existing.familyId === null) {
            throw AppError.forbidden('Không thể chỉnh sửa danh mục hệ thống')
        }

        return CategoryRepo.update(id, input)
    }

    static async delete(id: string) {
        const existing = await CategoryRepo.findById(id)
        if (!existing) throw AppError.notFound('Danh mục')

        if (existing.familyId === null) {
            throw AppError.forbidden('Không thể xóa danh mục hệ thống')
        }

        return CategoryRepo.softDelete(id)
    }
}
