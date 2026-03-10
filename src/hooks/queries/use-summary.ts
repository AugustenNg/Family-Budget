// =============================================================================
// CFO Family Finance App — Summary Query Hooks
// =============================================================================

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/hooks/use-api'
import { type HealthScoreResult } from '@/features/cashflow/health-score'

interface DashboardSummary {
    monthlyIncome: number
    monthlyExpense: number
    totalAssets: number
    totalLiabilities: number
    netWorth: number
    savingsRate: number
    budgetCompliance: number
    budgetCount: number
    overBudgetCount: number
    accounts: Array<{
        id: string
        name: string
        type: string
        balance: string
        includeInTotal: boolean
    }>
    debts: Array<{
        id: string
        name: string
        currentBalance: number
        monthlyPayment: number
    }>
    investments: Array<{
        id: string
        name: string
        purchaseAmount: number
        currentValue: number
    }>
}

export const summaryKeys = {
    all: ['summary'] as const,
    dashboard: () => [...summaryKeys.all, 'dashboard'] as const,
    healthScore: () => [...summaryKeys.all, 'health-score'] as const,
}

export function useSummary() {
    return useQuery({
        queryKey: summaryKeys.dashboard(),
        queryFn: () => api.get<DashboardSummary>('/summary'),
    })
}

export function useHealthScore() {
    return useQuery({
        queryKey: summaryKeys.healthScore(),
        queryFn: () => api.get<HealthScoreResult>('/summary/health-score'),
    })
}
