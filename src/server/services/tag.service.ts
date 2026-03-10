// =============================================================================
// CFO Family Finance App — Tag Service
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { type CreateTagInput, type UpdateTagInput } from '@/server/validators/tag.schema'

export class TagService {
    static async list(familyId: string) {
        return prisma.tag.findMany({
            where: { familyId },
            orderBy: { name: 'asc' },
        })
    }

    static async getById(id: string, familyId: string) {
        const tag = await prisma.tag.findFirst({ where: { id, familyId } })
        if (!tag) throw AppError.notFound('Nhãn')
        return tag
    }

    static async create(familyId: string, input: CreateTagInput) {
        return prisma.tag.create({
            data: {
                familyId,
                name: input.name,
                color: input.color,
            },
        })
    }

    static async update(id: string, familyId: string, input: UpdateTagInput) {
        const existing = await prisma.tag.findFirst({ where: { id, familyId } })
        if (!existing) throw AppError.notFound('Nhãn')

        return prisma.tag.update({ where: { id }, data: input })
    }

    static async delete(id: string, familyId: string) {
        const existing = await prisma.tag.findFirst({ where: { id, familyId } })
        if (!existing) throw AppError.notFound('Nhãn')

        // Delete tag links first, then tag
        await prisma.transactionTag.deleteMany({ where: { tagId: id } })
        await prisma.tag.delete({ where: { id } })
        return { deleted: true }
    }
}
