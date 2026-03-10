// =============================================================================
// CFO Family Finance App — Account Service
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { AccountRepo } from '@/server/repositories/account.repo'
import { type CreateAccountInput, type UpdateAccountInput } from '@/server/validators/account.schema'

export class AccountService {
    static async list(familyId: string, includeInactive = false) {
        return AccountRepo.findMany(familyId, includeInactive)
    }

    static async getById(id: string, familyId: string) {
        const account = await AccountRepo.findById(id, familyId)
        if (!account) throw AppError.notFound('Tài khoản')
        return account
    }

    static async create(familyId: string, input: CreateAccountInput) {
        return prisma.financialAccount.create({
            data: {
                familyId,
                name: input.name,
                type: input.type,
                currency: input.currency,
                balance: input.balance,
                creditLimit: input.creditLimit,
                statementDay: input.statementDay,
                paymentDueDays: input.paymentDueDays,
                interestRate: input.interestRate,
                minimumPayment: input.minimumPayment,
                gracePeriodDays: input.gracePeriodDays,
                bankName: input.bankName,
                accountNumber: input.accountNumber,
                branchName: input.branchName,
                icon: input.icon,
                color: input.color,
                sortOrder: input.sortOrder,
                includeInTotal: input.includeInTotal,
                isShared: input.isShared,
                notes: input.notes,
            },
        })
    }

    static async update(id: string, familyId: string, input: UpdateAccountInput) {
        const existing = await AccountRepo.findById(id, familyId)
        if (!existing) throw AppError.notFound('Tài khoản')

        return AccountRepo.update(id, input)
    }

    static async softDelete(id: string, familyId: string) {
        const existing = await AccountRepo.findById(id, familyId)
        if (!existing) throw AppError.notFound('Tài khoản')

        // Check if there are active transactions referencing this account
        const txCount = await prisma.transaction.count({
            where: {
                OR: [{ sourceAccountId: id }, { destAccountId: id }],
            },
        })

        if (txCount > 0) {
            // Soft delete — just mark as inactive
            return AccountRepo.softDelete(id)
        }

        // If no transactions, safe to soft delete
        return AccountRepo.softDelete(id)
    }
}
