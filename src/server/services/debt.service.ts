// =============================================================================
// CFO Family Finance App — Debt Service
// Payment recording + amortization integration
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { calculateAmortization, type DebtInput } from '@/features/debt/amortization'
import { type CreateDebtInput, type UpdateDebtInput, type CreateDebtPaymentInput } from '@/server/validators/debt.schema'

export class DebtService {
    static async list(familyId: string) {
        return prisma.debt.findMany({
            where: { familyId },
            include: {
                payments: { orderBy: { paymentDate: 'desc' }, take: 5 },
                account: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })
    }

    static async getById(id: string, familyId: string) {
        const debt = await prisma.debt.findFirst({
            where: { id, familyId },
            include: {
                payments: { orderBy: { paymentDate: 'desc' } },
                account: { select: { id: true, name: true } },
            },
        })
        if (!debt) throw AppError.notFound('Khoản nợ')
        return debt
    }

    static async create(familyId: string, input: CreateDebtInput) {
        return prisma.debt.create({
            data: {
                familyId,
                name: input.name,
                type: input.type,
                lenderName: input.lenderName,
                accountId: input.accountId,
                originalAmount: input.originalAmount,
                currentBalance: input.currentBalance,
                interestRate: input.interestRate,
                monthlyPayment: input.monthlyPayment,
                startDate: input.startDate,
                endDate: input.endDate,
                nextDueDate: input.nextDueDate,
                strategy: input.strategy,
                notes: input.notes,
            },
        })
    }

    static async update(id: string, familyId: string, input: UpdateDebtInput) {
        const existing = await prisma.debt.findFirst({ where: { id, familyId } })
        if (!existing) throw AppError.notFound('Khoản nợ')
        return prisma.debt.update({ where: { id }, data: input })
    }

    /**
     * Record a debt payment — atomic:
     * 1. Create DebtPayment record
     * 2. Decrease debt.currentBalance by principalPortion
     * 3. Decrease linked account balance by paymentAmount
     * 4. Create a DEBT_PAYMENT transaction
     */
    static async recordPayment(
        debtId: string,
        familyId: string,
        userId: string,
        input: CreateDebtPaymentInput,
    ) {
        return prisma.$transaction(async (tx) => {
            const debt = await tx.debt.findFirst({ where: { id: debtId, familyId } })
            if (!debt) throw AppError.notFound('Khoản nợ')

            const newBalance = Number(debt.currentBalance) - input.principalPortion
            const balanceAfter = Math.max(0, newBalance)

            // 1. Create payment record
            const payment = await tx.debtPayment.create({
                data: {
                    debtId,
                    paymentAmount: input.paymentAmount,
                    principalPortion: input.principalPortion,
                    interestPortion: input.interestPortion,
                    balanceAfter,
                    paymentDate: input.paymentDate,
                    notes: input.notes,
                },
            })

            // 2. Update debt balance
            await tx.debt.update({
                where: { id: debtId },
                data: {
                    currentBalance: balanceAfter,
                    ...(balanceAfter <= 0 && { isActive: false }),
                },
            })

            // 3. If linked to account, update account balance
            if (debt.accountId) {
                await tx.financialAccount.update({
                    where: { id: debt.accountId },
                    data: { balance: { decrement: input.paymentAmount } },
                })

                // 4. Create transaction
                await tx.transaction.create({
                    data: {
                        familyId,
                        userId,
                        sourceAccountId: debt.accountId,
                        type: 'DEBT_PAYMENT',
                        amount: input.paymentAmount,
                        description: `Trả nợ: ${debt.name}`,
                        date: input.paymentDate,
                        debtPaymentId: payment.id,
                    },
                })
            }

            return payment
        })
    }

    /**
     * Get amortization schedule using existing calculator
     */
    static async getAmortization(debtId: string, familyId: string) {
        const debt = await prisma.debt.findFirst({ where: { id: debtId, familyId } })
        if (!debt) throw AppError.notFound('Khoản nợ')

        const input: DebtInput = {
            id: debt.id,
            name: debt.name,
            currentBalance: Number(debt.currentBalance),
            interestRate: Number(debt.interestRate),
            monthlyPayment: Number(debt.monthlyPayment),
        }

        return calculateAmortization(input)
    }
}
