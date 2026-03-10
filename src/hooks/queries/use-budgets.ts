// =============================================================================
// CFO Family Finance App — Budget, Debt, Investment, Goal Query Hooks
// =============================================================================

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/hooks/use-api'

// ---- Query Keys ----

export const budgetKeys = {
    all: ['budgets'] as const,
    list: () => [...budgetKeys.all, 'list'] as const,
}

export const debtKeys = {
    all: ['debts'] as const,
    list: () => [...debtKeys.all, 'list'] as const,
    detail: (id: string) => [...debtKeys.all, id] as const,
    amortization: (id: string) => [...debtKeys.all, id, 'amortization'] as const,
}

export const investmentKeys = {
    all: ['investments'] as const,
    list: () => [...investmentKeys.all, 'list'] as const,
}

export const goalKeys = {
    all: ['goals'] as const,
    list: () => [...goalKeys.all, 'list'] as const,
}

// ---- Budget Hooks ----

export function useBudgets() {
    return useQuery({
        queryKey: budgetKeys.list(),
        queryFn: () => api.get('/budgets'),
    })
}

export function useAddBudget() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => api.post('/budgets', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
    })
}

// ---- Debt Hooks ----

export function useDebts() {
    return useQuery({
        queryKey: debtKeys.list(),
        queryFn: () => api.get('/debts'),
    })
}

export function useDebtAmortization(id: string) {
    return useQuery({
        queryKey: debtKeys.amortization(id),
        queryFn: () => api.get(`/debts/${id}/amortization`),
        enabled: !!id,
    })
}

export function useAddDebtPayment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ debtId, data }: { debtId: string; data: Record<string, unknown> }) =>
            api.post(`/debts/${debtId}/payments`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: debtKeys.all })
            qc.invalidateQueries({ queryKey: ['accounts'] })
            qc.invalidateQueries({ queryKey: ['summary'] })
        },
    })
}

// ---- Investment Hooks ----

export function useInvestments() {
    return useQuery({
        queryKey: investmentKeys.list(),
        queryFn: () => api.get('/investments'),
    })
}

export function useAddValuation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ investmentId, data }: { investmentId: string; data: Record<string, unknown> }) =>
            api.post(`/investments/${investmentId}/valuations`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: investmentKeys.all })
            qc.invalidateQueries({ queryKey: ['summary'] })
        },
    })
}

// ---- Goal Hooks ----

export function useGoals() {
    return useQuery({
        queryKey: goalKeys.list(),
        queryFn: () => api.get('/goals'),
    })
}

export function useContributeToGoal() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ goalId, data }: { goalId: string; data: Record<string, unknown> }) =>
            api.post(`/goals/${goalId}/contribute`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: goalKeys.all })
            qc.invalidateQueries({ queryKey: ['accounts'] })
            qc.invalidateQueries({ queryKey: ['summary'] })
            qc.invalidateQueries({ queryKey: ['transactions'] })
        },
    })
}
