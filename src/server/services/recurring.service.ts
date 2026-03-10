// =============================================================================
// CFO Family Finance App — Recurring Transaction Service
// Auto-generate transactions based on recurring rules
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { type TransactionType } from '@prisma/client'

export class RecurringService {
    /**
     * List recurring rules for a family
     */
    static async list(familyId: string) {
        return prisma.recurringTransaction.findMany({
            where: { familyId, isActive: true },
            include: {
                sourceAccount: { select: { id: true, name: true, type: true } },
                category: { select: { id: true, name: true, icon: true } },
            },
            orderBy: { nextOccurrence: 'asc' },
        })
    }

    /**
     * Create a recurring transaction rule
     */
    static async create(
        familyId: string,
        userId: string,
        input: {
            sourceAccountId: string
            type: TransactionType
            amount: number
            description?: string
            categoryId?: string
            frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'
            startDate: Date
            endDate?: Date
        },
    ) {
        // Verify account belongs to family
        const account = await prisma.financialAccount.findFirst({
            where: { id: input.sourceAccountId, familyId },
        })
        if (!account) throw AppError.notFound('Tài khoản nguồn')

        return prisma.recurringTransaction.create({
            data: {
                familyId,
                userId,
                sourceAccountId: input.sourceAccountId,
                type: input.type,
                amount: input.amount,
                description: input.description,
                categoryId: input.categoryId,
                frequency: input.frequency,
                startDate: input.startDate,
                endDate: input.endDate,
                nextOccurrence: input.startDate,
                isActive: true,
            },
        })
    }

    /**
     * Process due recurring transactions
     * This should be called by a CRON job / scheduled function
     */
    static async processDue() {
        const now = new Date()
        const dueRules = await prisma.recurringTransaction.findMany({
            where: {
                isActive: true,
                nextOccurrence: { lte: now },
                OR: [{ endDate: null }, { endDate: { gte: now } }],
            },
        })

        const results = []

        for (const rule of dueRules) {
            try {
                await prisma.$transaction(async (tx) => {
                    // 1. Create transaction
                    await tx.transaction.create({
                        data: {
                            familyId: rule.familyId,
                            userId: rule.userId,
                            sourceAccountId: rule.sourceAccountId,
                            type: rule.type,
                            amount: rule.amount,
                            description: rule.description ? `[Tự động] ${rule.description}` : '[Tự động]',
                            date: now,
                            categoryId: rule.categoryId,
                        },
                    })

                    // 2. Update account balance
                    const delta =
                        rule.type === 'INCOME'
                            ? Number(rule.amount)
                            : -Number(rule.amount)

                    await tx.financialAccount.update({
                        where: { id: rule.sourceAccountId },
                        data: { balance: { increment: delta } },
                    })

                    // 3. Calculate next occurrence
                    const nextDate = RecurringService.calculateNextDate(
                        rule.nextOccurrence!,
                        rule.frequency,
                    )

                    // 4. If next date exceeds endDate, deactivate
                    const shouldDeactivate = rule.endDate && nextDate > rule.endDate

                    await tx.recurringTransaction.update({
                        where: { id: rule.id },
                        data: {
                            nextOccurrence: nextDate,
                            lastProcessed: now,
                            ...(shouldDeactivate && { isActive: false }),
                        },
                    })
                })

                results.push({ id: rule.id, status: 'processed' })
            } catch (error) {
                results.push({
                    id: rule.id,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown',
                })
            }
        }

        return { processed: results.length, results }
    }

    private static calculateNextDate(
        current: Date,
        frequency: string,
    ): Date {
        const next = new Date(current)
        switch (frequency) {
            case 'DAILY':
                next.setDate(next.getDate() + 1)
                break
            case 'WEEKLY':
                next.setDate(next.getDate() + 7)
                break
            case 'BIWEEKLY':
                next.setDate(next.getDate() + 14)
                break
            case 'MONTHLY':
                next.setMonth(next.getMonth() + 1)
                break
            case 'YEARLY':
                next.setFullYear(next.getFullYear() + 1)
                break
        }
        return next
    }
}
