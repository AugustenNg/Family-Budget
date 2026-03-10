// =============================================================================
// CFO Family Finance App — Transaction Service
// Atomic CRUD with balance side effects using prisma.$transaction()
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { TransactionRepo } from '@/server/repositories/transaction.repo'
import { type CreateTransactionInput, type UpdateTransactionInput, type ListTransactionsInput } from '@/server/validators/transaction.schema'
import { type TransactionType } from '@prisma/client'

// ---- Balance delta helpers ----

function getBalanceDelta(type: TransactionType, amount: number): number {
    switch (type) {
        case 'INCOME':
            return amount
        case 'EXPENSE':
        case 'TRANSFER':
        case 'CREDIT_PAYMENT':
        case 'DEBT_PAYMENT':
            return -amount
    }
}

export class TransactionService {
    // --------------------------------------------------------------------------
    // LIST
    // --------------------------------------------------------------------------
    static async list(familyId: string, input: ListTransactionsInput) {
        const { page, limit, sortBy, sortOrder, type, accountId, categoryId, search, from, to, minAmount, maxAmount } = input
        return TransactionRepo.findMany(
            familyId,
            { type, accountId, categoryId, search, from, to, minAmount, maxAmount },
            { page, limit },
            { sortBy, sortOrder },
        )
    }

    // --------------------------------------------------------------------------
    // GET BY ID
    // --------------------------------------------------------------------------
    static async getById(id: string, familyId: string) {
        const tx = await TransactionRepo.findById(id, familyId)
        if (!tx) throw AppError.notFound('Giao dịch')
        return tx
    }

    // --------------------------------------------------------------------------
    // CREATE — Atomic: create TX + adjust balances + link tags
    // --------------------------------------------------------------------------
    static async create(familyId: string, userId: string, input: CreateTransactionInput) {
        const { tagIds, ...txData } = input

        return prisma.$transaction(async (tx) => {
            // 1. Verify source account belongs to family
            const sourceAccount = await tx.financialAccount.findFirst({
                where: { id: txData.sourceAccountId, familyId },
            })
            if (!sourceAccount) throw AppError.notFound('Tài khoản nguồn')

            // 2. Verify dest account if TRANSFER
            if (txData.type === 'TRANSFER' && txData.destAccountId) {
                const destAccount = await tx.financialAccount.findFirst({
                    where: { id: txData.destAccountId, familyId },
                })
                if (!destAccount) throw AppError.notFound('Tài khoản đích')
            }

            // 3. Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    familyId,
                    userId,
                    sourceAccountId: txData.sourceAccountId,
                    type: txData.type as TransactionType,
                    amount: txData.amount,
                    description: txData.description,
                    date: txData.date,
                    categoryId: txData.categoryId,
                    destAccountId: txData.destAccountId,
                    transferFee: txData.transferFee,
                    location: txData.location,
                    isPending: txData.isPending,
                    isExcluded: txData.isExcluded,
                },
            })

            // 4. Update source account balance
            const delta = getBalanceDelta(txData.type as TransactionType, txData.amount)
            await tx.financialAccount.update({
                where: { id: txData.sourceAccountId },
                data: { balance: { increment: delta } },
            })

            // 5. Update dest account balance (TRANSFER only)
            if (txData.type === 'TRANSFER' && txData.destAccountId) {
                await tx.financialAccount.update({
                    where: { id: txData.destAccountId },
                    data: { balance: { increment: txData.amount } },
                })
            }

            // 6. Link tags
            if (tagIds && tagIds.length > 0) {
                await tx.transactionTag.createMany({
                    data: tagIds.map((tagId) => ({
                        transactionId: transaction.id,
                        tagId,
                    })),
                })
            }

            return transaction
        })
    }

    // --------------------------------------------------------------------------
    // UPDATE — Atomic: reverse old effects → apply new effects
    // --------------------------------------------------------------------------
    static async update(id: string, familyId: string, input: UpdateTransactionInput) {
        const existing = await TransactionRepo.findById(id, familyId)
        if (!existing) throw AppError.notFound('Giao dịch')

        const { tagIds, ...updateData } = input

        return prisma.$transaction(async (tx) => {
            const oldType = existing.type
            const oldAmount = Number(existing.amount)
            const newType = (updateData.type ?? oldType) as TransactionType
            const newAmount = updateData.amount ?? oldAmount

            // 1. Reverse OLD balance effects on source account
            const oldDelta = getBalanceDelta(oldType, oldAmount)
            await tx.financialAccount.update({
                where: { id: existing.sourceAccountId },
                data: { balance: { increment: -oldDelta } }, // reverse
            })

            // Reverse OLD dest account (if was TRANSFER)
            if (oldType === 'TRANSFER' && existing.destAccountId) {
                await tx.financialAccount.update({
                    where: { id: existing.destAccountId },
                    data: { balance: { increment: -oldAmount } },
                })
            }

            // 2. Apply NEW balance effects
            const newSourceId = updateData.sourceAccountId ?? existing.sourceAccountId
            const newDelta = getBalanceDelta(newType, newAmount)
            await tx.financialAccount.update({
                where: { id: newSourceId },
                data: { balance: { increment: newDelta } },
            })

            // Apply to new dest account
            const newDestId = updateData.destAccountId ?? existing.destAccountId
            if (newType === 'TRANSFER' && newDestId) {
                await tx.financialAccount.update({
                    where: { id: newDestId },
                    data: { balance: { increment: newAmount } },
                })
            }

            // 3. Update transaction record
            const updated = await tx.transaction.update({
                where: { id },
                data: updateData,
            })

            // 4. Re-link tags if provided
            if (tagIds !== undefined) {
                await tx.transactionTag.deleteMany({ where: { transactionId: id } })
                if (tagIds.length > 0) {
                    await tx.transactionTag.createMany({
                        data: tagIds.map((tagId) => ({ transactionId: id, tagId })),
                    })
                }
            }

            return updated
        })
    }

    // --------------------------------------------------------------------------
    // DELETE — Atomic: reverse balances + cleanup
    // --------------------------------------------------------------------------
    static async delete(id: string, familyId: string) {
        const existing = await TransactionRepo.findById(id, familyId)
        if (!existing) throw AppError.notFound('Giao dịch')

        return prisma.$transaction(async (tx) => {
            // 1. Reverse balance effects on source account
            const delta = getBalanceDelta(existing.type, Number(existing.amount))
            await tx.financialAccount.update({
                where: { id: existing.sourceAccountId },
                data: { balance: { increment: -delta } },
            })

            // 2. Reverse dest account balance (TRANSFER)
            if (existing.type === 'TRANSFER' && existing.destAccountId) {
                await tx.financialAccount.update({
                    where: { id: existing.destAccountId },
                    data: { balance: { increment: -Number(existing.amount) } },
                })
            }

            // 3. Delete tag links
            await tx.transactionTag.deleteMany({ where: { transactionId: id } })

            // 4. Delete transaction
            await tx.transaction.delete({ where: { id } })

            return { deleted: true }
        })
    }
}
