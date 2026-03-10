// =============================================================================
// CFO Family Finance App — Transaction Repository
// Pure data access layer — no business logic
// =============================================================================

import { prisma } from '@/lib/prisma'
import { type Prisma } from '@prisma/client'
import { type PaginationInput } from '@/server/types/api.types'

export class TransactionRepo {
    static async findById(id: string, familyId: string) {
        return prisma.transaction.findFirst({
            where: { id, familyId },
            include: {
                sourceAccount: { select: { id: true, name: true, type: true } },
                destAccount: { select: { id: true, name: true, type: true } },
                category: { select: { id: true, name: true, icon: true, type: true } },
                user: { select: { id: true, name: true, avatarUrl: true } },
                transactionTags: { include: { tag: true } },
            },
        })
    }

    static async findMany(
        familyId: string,
        filters: {
            type?: string
            accountId?: string
            categoryId?: string
            search?: string
            from?: Date
            to?: Date
            minAmount?: number
            maxAmount?: number
        },
        pagination: PaginationInput,
        sort: { sortBy: string; sortOrder: 'asc' | 'desc' },
    ) {
        const where: Prisma.TransactionWhereInput = {
            familyId,
            ...(filters.type && { type: filters.type as Prisma.EnumTransactionTypeFilter }),
            ...(filters.accountId && {
                OR: [
                    { sourceAccountId: filters.accountId },
                    { destAccountId: filters.accountId },
                ],
            }),
            ...(filters.categoryId && { categoryId: filters.categoryId }),
            ...(filters.search && {
                description: { contains: filters.search, mode: 'insensitive' as const },
            }),
            ...((filters.from || filters.to) && {
                date: {
                    ...(filters.from && { gte: filters.from }),
                    ...(filters.to && { lte: filters.to }),
                },
            }),
            ...((filters.minAmount || filters.maxAmount) && {
                amount: {
                    ...(filters.minAmount && { gte: filters.minAmount }),
                    ...(filters.maxAmount && { lte: filters.maxAmount }),
                },
            }),
        }

        const [data, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    sourceAccount: { select: { id: true, name: true, type: true, icon: true } },
                    destAccount: { select: { id: true, name: true, type: true, icon: true } },
                    category: { select: { id: true, name: true, icon: true } },
                    user: { select: { id: true, name: true } },
                    transactionTags: { include: { tag: true } },
                },
                orderBy: { [sort.sortBy]: sort.sortOrder },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit,
            }),
            prisma.transaction.count({ where }),
        ])

        return {
            data,
            meta: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                hasMore: pagination.page * pagination.limit < total,
            },
        }
    }

    static async create(data: Prisma.TransactionCreateInput) {
        return prisma.transaction.create({
            data,
            include: {
                sourceAccount: { select: { id: true, name: true } },
                destAccount: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, icon: true } },
                transactionTags: { include: { tag: true } },
            },
        })
    }

    static async update(id: string, data: Prisma.TransactionUpdateInput) {
        return prisma.transaction.update({
            where: { id },
            data,
            include: {
                sourceAccount: { select: { id: true, name: true } },
                destAccount: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, icon: true } },
                transactionTags: { include: { tag: true } },
            },
        })
    }

    static async delete(id: string) {
        return prisma.transaction.delete({ where: { id } })
    }
}
