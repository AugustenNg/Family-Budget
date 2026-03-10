// =============================================================================
// CFO Family Finance App — Investment Service
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { type CreateInvestmentInput, type UpdateInvestmentInput, type CreateValuationInput } from '@/server/validators/investment.schema'

export class InvestmentService {
    static async list(familyId: string) {
        return prisma.investment.findMany({
            where: { familyId },
            include: {
                valuations: { orderBy: { valuationDate: 'desc' }, take: 5 },
                account: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })
    }

    static async getById(id: string, familyId: string) {
        const investment = await prisma.investment.findFirst({
            where: { id, familyId },
            include: {
                valuations: { orderBy: { valuationDate: 'desc' } },
                account: { select: { id: true, name: true } },
            },
        })
        if (!investment) throw AppError.notFound('Khoản đầu tư')
        return investment
    }

    static async create(familyId: string, input: CreateInvestmentInput) {
        return prisma.investment.create({
            data: {
                familyId,
                name: input.name,
                symbol: input.symbol,
                type: input.type,
                accountId: input.accountId,
                purchaseAmount: input.purchaseAmount,
                currentValue: input.currentValue,
                quantity: input.quantity,
                purchasePrice: input.purchasePrice,
                currency: input.currency,
                purchaseDate: input.purchaseDate,
                maturityDate: input.maturityDate,
                interestRate: input.interestRate,
                expectedReturn: input.expectedReturn,
                institution: input.institution,
                notes: input.notes,
            },
        })
    }

    static async update(id: string, familyId: string, input: UpdateInvestmentInput) {
        const existing = await prisma.investment.findFirst({ where: { id, familyId } })
        if (!existing) throw AppError.notFound('Khoản đầu tư')
        return prisma.investment.update({ where: { id }, data: input })
    }

    /**
     * Add a valuation + update investment.currentValue
     */
    static async addValuation(investmentId: string, familyId: string, input: CreateValuationInput) {
        const investment = await prisma.investment.findFirst({
            where: { id: investmentId, familyId },
        })
        if (!investment) throw AppError.notFound('Khoản đầu tư')

        return prisma.$transaction(async (tx) => {
            const valuation = await tx.investmentValuation.create({
                data: {
                    investmentId,
                    value: input.value,
                    quantity: input.quantity,
                    pricePerUnit: input.pricePerUnit,
                    valuationDate: input.valuationDate,
                    source: input.source,
                },
            })

            // Update investment's current value
            await tx.investment.update({
                where: { id: investmentId },
                data: {
                    currentValue: input.value,
                    ...(input.quantity && { quantity: input.quantity }),
                },
            })

            return valuation
        })
    }
}
