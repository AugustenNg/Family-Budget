// =============================================================================
// CFO Family Finance App — Budget Service
// Dedup check + auto-create BudgetAlert records
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { type CreateBudgetInput, type UpdateBudgetInput } from '@/server/validators/budget.schema'

export class BudgetService {
    static async list(familyId: string) {
        const now = new Date()
        const budgets = await prisma.budget.findMany({
            where: { familyId },
            include: {
                category: { select: { id: true, name: true, icon: true, color: true } },
                alerts: true,
            },
            orderBy: { periodStart: 'desc' },
        })

        // Compute "spent" for each budget via transaction aggregate
        const budgetIds = budgets.map((b) => b.id)
        const spending = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                familyId,
                type: 'EXPENSE',
                isExcluded: false,
                categoryId: { in: budgets.map((b) => b.categoryId) },
                date: {
                    gte: budgets[0]?.periodStart ?? now,
                    lte: budgets[0]?.periodEnd ?? now,
                },
            },
            _sum: { amount: true },
        })

        const spendingMap = new Map(
            spending.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)]),
        )

        return budgets.map((b) => ({
            ...b,
            amount: Number(b.amount),
            spent: spendingMap.get(b.categoryId) ?? 0,
            remaining: Number(b.amount) - (spendingMap.get(b.categoryId) ?? 0),
        }))
    }

    static async create(familyId: string, input: CreateBudgetInput) {
        // Dedup check: no existing budget for same category + overlapping period
        const existing = await prisma.budget.findFirst({
            where: {
                familyId,
                categoryId: input.categoryId,
                periodStart: { lte: input.periodEnd },
                periodEnd: { gte: input.periodStart },
            },
        })

        if (existing) {
            throw AppError.conflict('Đã có ngân sách cho danh mục này trong cùng khoảng thời gian')
        }

        return prisma.$transaction(async (tx) => {
            // Create budget
            const budget = await tx.budget.create({
                data: {
                    familyId,
                    categoryId: input.categoryId,
                    amount: input.amount,
                    currency: input.currency,
                    periodStart: input.periodStart,
                    periodEnd: input.periodEnd,
                    rollover: input.rollover,
                    notes: input.notes,
                },
            })

            // Auto-create BudgetAlert records for thresholds
            const thresholds = input.alertThresholds ?? [50, 80, 100]
            await tx.budgetAlert.createMany({
                data: thresholds.map((threshold) => ({
                    budgetId: budget.id,
                    thresholdPercent: threshold,
                })),
            })

            return budget
        })
    }

    static async update(id: string, familyId: string, input: UpdateBudgetInput) {
        const existing = await prisma.budget.findFirst({ where: { id, familyId } })
        if (!existing) throw AppError.notFound('Ngân sách')

        return prisma.budget.update({ where: { id }, data: input })
    }

    static async delete(id: string, familyId: string) {
        const existing = await prisma.budget.findFirst({ where: { id, familyId } })
        if (!existing) throw AppError.notFound('Ngân sách')

        // Cascade deletes alerts via schema relation onDelete: Cascade
        await prisma.budget.delete({ where: { id } })
        return { deleted: true }
    }
}
