// =============================================================================
// CFO Family Finance App — Account Repository
// =============================================================================

import { prisma } from '@/lib/prisma'
import { type Prisma } from '@prisma/client'

export class AccountRepo {
    static async findById(id: string, familyId: string) {
        return prisma.financialAccount.findFirst({
            where: { id, familyId },
        })
    }

    static async findMany(familyId: string, includeInactive = false) {
        return prisma.financialAccount.findMany({
            where: {
                familyId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        })
    }

    static async create(data: Prisma.FinancialAccountCreateInput) {
        return prisma.financialAccount.create({ data })
    }

    static async update(id: string, data: Prisma.FinancialAccountUpdateInput) {
        return prisma.financialAccount.update({ where: { id }, data })
    }

    static async softDelete(id: string) {
        return prisma.financialAccount.update({
            where: { id },
            data: { isActive: false },
        })
    }

    static async updateBalance(id: string, delta: number) {
        return prisma.financialAccount.update({
            where: { id },
            data: { balance: { increment: delta } },
        })
    }
}
