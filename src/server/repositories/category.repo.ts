// =============================================================================
// CFO Family Finance App — Category Repository
// =============================================================================

import { prisma } from '@/lib/prisma'
import { type Prisma } from '@prisma/client'

export class CategoryRepo {
    static async findById(id: string) {
        return prisma.category.findUnique({
            where: { id },
            include: { children: true },
        })
    }

    static async findMany(familyId: string) {
        // Return system categories (familyId = null) + family custom categories
        return prisma.category.findMany({
            where: {
                OR: [{ familyId: null }, { familyId }],
                isActive: true,
            },
            include: { children: { where: { isActive: true } } },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        })
    }

    static async create(data: Prisma.CategoryCreateInput) {
        return prisma.category.create({ data })
    }

    static async update(id: string, data: Prisma.CategoryUpdateInput) {
        return prisma.category.update({ where: { id }, data })
    }

    static async softDelete(id: string) {
        return prisma.category.update({
            where: { id },
            data: { isActive: false },
        })
    }
}
