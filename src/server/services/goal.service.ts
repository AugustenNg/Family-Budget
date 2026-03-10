// =============================================================================
// CFO Family Finance App — Goal Service
// contributeToGoal atomic flow
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { type CreateGoalInput, type UpdateGoalInput, type ContributeToGoalInput } from '@/server/validators/goal.schema'

export class GoalService {
    static async list(familyId: string) {
        return prisma.savingsGoal.findMany({
            where: { familyId },
            include: { contributions: { orderBy: { contributionDate: 'desc' }, take: 5 } },
            orderBy: { createdAt: 'desc' },
        })
    }

    static async getById(id: string, familyId: string) {
        const goal = await prisma.savingsGoal.findFirst({
            where: { id, familyId },
            include: { contributions: { orderBy: { contributionDate: 'desc' } } },
        })
        if (!goal) throw AppError.notFound('Mục tiêu tiết kiệm')
        return goal
    }

    static async create(familyId: string, input: CreateGoalInput) {
        return prisma.savingsGoal.create({
            data: {
                familyId,
                name: input.name,
                targetAmount: input.targetAmount,
                currency: input.currency,
                targetDate: input.targetDate,
                icon: input.icon,
                color: input.color,
                notes: input.notes,
            },
        })
    }

    static async update(id: string, familyId: string, input: UpdateGoalInput) {
        const existing = await prisma.savingsGoal.findFirst({ where: { id, familyId } })
        if (!existing) throw AppError.notFound('Mục tiêu tiết kiệm')
        return prisma.savingsGoal.update({ where: { id }, data: input })
    }

    /**
     * Contribute to a goal — atomic flow:
     * 1. Verify goal not completed + account has sufficient balance
     * 2. Cap amount at remaining target
     * 3. Create SavingsContribution
     * 4. Increment goal.currentAmount
     * 5. Decrement account.balance
     * 6. Create TRANSFER Transaction
     * 7. If goal completed → create Notification
     */
    static async contribute(
        id: string,
        familyId: string,
        userId: string,
        input: ContributeToGoalInput,
    ) {
        return prisma.$transaction(async (tx) => {
            // 1. Verify goal
            const goal = await tx.savingsGoal.findFirst({ where: { id, familyId } })
            if (!goal) throw AppError.notFound('Mục tiêu tiết kiệm')
            if (goal.isCompleted) throw AppError.badRequest('Mục tiêu này đã hoàn thành')

            // Verify account
            const account = await tx.financialAccount.findFirst({
                where: { id: input.fromAccountId, familyId },
            })
            if (!account) throw AppError.notFound('Tài khoản nguồn')

            if (Number(account.balance) < input.amount) {
                throw AppError.badRequest('Số dư tài khoản không đủ')
            }

            // 2. Cap amount
            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
            const actualAmount = Math.min(input.amount, remaining)

            // 3. Create contribution
            const contribution = await tx.savingsContribution.create({
                data: {
                    goalId: id,
                    amount: actualAmount,
                    contributionDate: new Date(),
                    notes: input.notes,
                },
            })

            // 4. Increment goal
            const newCurrentAmount = Number(goal.currentAmount) + actualAmount
            const isCompleted = newCurrentAmount >= Number(goal.targetAmount)

            await tx.savingsGoal.update({
                where: { id },
                data: {
                    currentAmount: { increment: actualAmount },
                    ...(isCompleted && { isCompleted: true, completedAt: new Date() }),
                },
            })

            // 5. Decrement account balance
            await tx.financialAccount.update({
                where: { id: input.fromAccountId },
                data: { balance: { decrement: actualAmount } },
            })

            // 6. Create transaction record
            await tx.transaction.create({
                data: {
                    familyId,
                    userId,
                    sourceAccountId: input.fromAccountId,
                    type: 'TRANSFER',
                    amount: actualAmount,
                    description: `Đóng góp mục tiêu: ${goal.name}`,
                    date: new Date(),
                    savingsContributionId: contribution.id,
                },
            })

            // 7. Notification on completion
            if (isCompleted) {
                await tx.notification.create({
                    data: {
                        familyId,
                        userId,
                        type: 'SAVINGS_GOAL_REACHED',
                        title: 'Mục tiêu hoàn thành! 🎉',
                        message: `Đã đạt mục tiêu "${goal.name}"`,
                        isRead: false,
                    },
                })
            }

            return { contribution, actualAmount, isCompleted }
        })
    }
}
