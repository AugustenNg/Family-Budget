// =============================================================================
// CFO Family Finance App — Transaction Query & Mutation Hooks
// =============================================================================

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/hooks/use-api'

// ---- Types (mirrored from API response) ----

interface Transaction {
    id: string
    type: string
    amount: string
    description: string | null
    date: string
    sourceAccount: { id: string; name: string; type: string; icon?: string }
    destAccount?: { id: string; name: string; type: string; icon?: string } | null
    category?: { id: string; name: string; icon: string } | null
    user: { id: string; name: string }
    transactionTags: { tag: { id: string; name: string; color?: string } }[]
}

interface TransactionListResponse {
    data: Transaction[]
    meta: { page: number; limit: number; total: number; hasMore: boolean }
}

interface TransactionFilters {
    page?: number
    limit?: number
    type?: string
    accountId?: string
    categoryId?: string
    search?: string
    from?: string
    to?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

// ---- Query keys ----

export const transactionKeys = {
    all: ['transactions'] as const,
    lists: () => [...transactionKeys.all, 'list'] as const,
    list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
    detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
}

// ---- Queries ----

export function useTransactions(filters: TransactionFilters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value))
    })
    const query = params.toString()
    const path = query ? `/transactions?${query}` : '/transactions'

    return useQuery({
        queryKey: transactionKeys.list(filters),
        queryFn: () => api.get<TransactionListResponse>(path),
    })
}

export function useTransaction(id: string) {
    return useQuery({
        queryKey: transactionKeys.detail(id),
        queryFn: () => api.get<Transaction>(`/transactions/${id}`),
        enabled: !!id,
    })
}

// ---- Mutations ----

export function useAddTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: Record<string, unknown>) => api.post<Transaction>('/transactions', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
        },
    })
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            api.patch<Transaction>(`/transactions/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
        },
    })
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/transactions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
        },
    })
}
