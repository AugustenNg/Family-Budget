// =============================================================================
// CFO Family Finance App — Account Query & Mutation Hooks
// =============================================================================

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/hooks/use-api'

interface FinancialAccount {
    id: string
    name: string
    type: string
    currency: string
    balance: string
    creditLimit?: string | null
    statementDay?: number | null
    bankName?: string | null
    icon?: string | null
    color?: string | null
    isActive: boolean
    includeInTotal: boolean
    isShared: boolean
}

export const accountKeys = {
    all: ['accounts'] as const,
    list: () => [...accountKeys.all, 'list'] as const,
    detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
}

export function useAccounts() {
    return useQuery({
        queryKey: accountKeys.list(),
        queryFn: () => api.get<FinancialAccount[]>('/accounts'),
    })
}

export function useAccount(id: string) {
    return useQuery({
        queryKey: accountKeys.detail(id),
        queryFn: () => api.get<FinancialAccount>(`/accounts/${id}`),
        enabled: !!id,
    })
}

export function useAddAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: Record<string, unknown>) => api.post<FinancialAccount>('/accounts', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
        },
    })
}

export function useUpdateAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            api.patch<FinancialAccount>(`/accounts/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
        },
    })
}

export function useDeleteAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/accounts/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
        },
    })
}
