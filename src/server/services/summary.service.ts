// =============================================================================
// CFO Family Finance App — Summary Service
// Dashboard aggregation: 7 parallel queries + health score
// =============================================================================

import { prisma } from '@/lib/prisma'
import { calculateHealthScore, type HealthScoreInput } from '@/features/cashflow/health-score'

export class SummaryService {
    /**
     * Get full dashboard summary with 7 parallel queries
     */
    static async getDashboardSummary(familyId: string) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const [
            monthlyIncome,
            monthlyExpense,
            accounts,
            debts,
            investments,
            budgets,
            budgetSpending,
        ] = await Promise.all([
            // 1. Monthly income
            prisma.transaction.aggregate({
                where: {
                    familyId,
                    type: 'INCOME',
                    date: { gte: startOfMonth, lte: endOfMonth },
                    isExcluded: false,
                },
                _sum: { amount: true },
            }),

            // 2. Monthly expense
            prisma.transaction.aggregate({
                where: {
                    familyId,
                    type: 'EXPENSE',
                    date: { gte: startOfMonth, lte: endOfMonth },
                    isExcluded: false,
                },
                _sum: { amount: true },
            }),

            // 3. All active accounts
            prisma.financialAccount.findMany({
                where: { familyId, isActive: true },
                select: { id: true, name: true, type: true, balance: true, includeInTotal: true },
            }),

            // 4. Active debts
            prisma.debt.findMany({
                where: { familyId, isActive: true },
                select: { id: true, name: true, currentBalance: true, monthlyPayment: true },
            }),

            // 5. Active investments
            prisma.investment.findMany({
                where: { familyId, isActive: true },
                select: { id: true, name: true, purchaseAmount: true, currentValue: true },
            }),

            // 6. Active budgets for current period
            prisma.budget.findMany({
                where: {
                    familyId,
                    periodStart: { lte: endOfMonth },
                    periodEnd: { gte: startOfMonth },
                },
                select: { id: true, categoryId: true, amount: true },
            }),

            // 7. Budget spending (expense by category this month)
            prisma.transaction.groupBy({
                by: ['categoryId'],
                where: {
                    familyId,
                    type: 'EXPENSE',
                    date: { gte: startOfMonth, lte: endOfMonth },
                    isExcluded: false,
                },
                _sum: { amount: true },
            }),
        ])

        // ---- Compute aggregates ----
        const income = Number(monthlyIncome._sum.amount ?? 0)
        const expense = Number(monthlyExpense._sum.amount ?? 0)

        // Assets = accounts with includeInTotal (exclude CREDIT_CARD, LOAN)
        const totalAssets = accounts
            .filter((a) => a.includeInTotal && !['CREDIT_CARD', 'LOAN'].includes(a.type))
            .reduce((sum, a) => sum + Number(a.balance), 0)

        // Liabilities = credit cards + loans
        const totalLiabilities = accounts
            .filter((a) => ['CREDIT_CARD', 'LOAN'].includes(a.type))
            .reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0)
            + debts.reduce((sum, d) => sum + Number(d.currentBalance), 0)

        const netWorth = totalAssets - totalLiabilities
        const savingsRate = income > 0 ? (income - expense) / income : 0

        // Budget compliance
        const spendingMap = new Map(budgetSpending.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)]))
        const overBudgetCount = budgets.filter((b) => {
            const spent = spendingMap.get(b.categoryId) ?? 0
            return spent > Number(b.amount)
        }).length

        const budgetCompliance = budgets.length > 0 ? 1 - overBudgetCount / budgets.length : 0

        return {
            monthlyIncome: income,
            monthlyExpense: expense,
            totalAssets,
            totalLiabilities,
            netWorth,
            savingsRate,
            budgetCompliance,
            accounts,
            debts: debts.map((d) => ({ ...d, currentBalance: Number(d.currentBalance) })),
            investments: investments.map((i) => ({
                ...i,
                purchaseAmount: Number(i.purchaseAmount),
                currentValue: Number(i.currentValue),
            })),
            budgetCount: budgets.length,
            overBudgetCount,
        }
    }

    /**
     * Get health score using existing health-score.ts calculator
     */
    static async getHealthScore(familyId: string) {
        const summary = await this.getDashboardSummary(familyId)

        const totalInvestment = summary.investments.reduce((s, i) => s + i.currentValue, 0)
        const totalDebt = summary.debts.reduce((s, d) => s + d.currentBalance, 0)
        const monthlyDebtPayment = summary.debts.reduce((s, d) => s + Number(d.monthlyPayment), 0)

        // Rough estimate of emergency fund months
        const liquidAssets = summary.accounts
            .filter((a) => ['CASH', 'BANK_ACCOUNT', 'E_WALLET', 'SAVINGS'].includes(a.type))
            .reduce((s, a) => s + Number(a.balance), 0)
        const emergencyFundMonths = summary.monthlyExpense > 0
            ? liquidAssets / summary.monthlyExpense
            : 0

        const input: HealthScoreInput = {
            monthlyIncome: summary.monthlyIncome,
            monthlyExpense: summary.monthlyExpense,
            monthlySavings: Math.max(0, summary.monthlyIncome - summary.monthlyExpense),
            emergencyFundMonths,
            totalDebt,
            monthlyDebtPayment,
            totalInvestment,
            monthlyInvestment: 0, // Would need monthly investment tracking
            budgetedCategories: summary.budgetCount,
            overBudgetCategories: summary.overBudgetCount,
        }

        return calculateHealthScore(input)
    }
}
