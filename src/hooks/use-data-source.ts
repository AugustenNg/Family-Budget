// =============================================================================
// CFO Family Finance App — Data Source Adapter
// Provides hooks that work with both Zustand (demo) and API (production)
// When API is available (user is authenticated), uses TanStack Query
// Otherwise falls back to Zustand localStorage store
// =============================================================================

'use client'

import { useSession } from 'next-auth/react'
import { useAppStore, type Summary } from '@/lib/store'
import { type Account, type Transaction, type Budget, type Debt } from '@/lib/mock-data'
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/queries/use-transactions'
import { useAccounts, useAddAccount, useUpdateAccount } from '@/hooks/queries/use-accounts'
import { useBudgets, useAddBudget } from '@/hooks/queries/use-budgets'
import { useDebts, useInvestments, useGoals, useContributeToGoal } from '@/hooks/queries/use-budgets'
import { useSummary } from '@/hooks/queries/use-summary'

/**
 * Check if the app should use API data (authenticated) or Zustand (demo mode)
 */
export function useIsApiMode(): boolean {
  const { data: session } = useSession()
  return !!session?.user
}

/**
 * Hook: Get transactions (API or Zustand)
 */
export function useTransactionData() {
  const isApi = useIsApiMode()
  const storeTransactions = useAppStore(s => s.transactions)
  const apiQuery = useTransactions({})

  if (isApi && apiQuery.data) {
    return {
      data: apiQuery.data.data,
      isLoading: apiQuery.isLoading,
      isApi: true,
    }
  }

  return {
    data: storeTransactions,
    isLoading: false,
    isApi: false,
  }
}

/**
 * Hook: Get accounts (API or Zustand)
 */
export function useAccountData() {
  const isApi = useIsApiMode()
  const storeAccounts = useAppStore(s => s.accounts)
  const apiQuery = useAccounts()

  if (isApi && apiQuery.data) {
    return {
      data: apiQuery.data,
      isLoading: apiQuery.isLoading,
      isApi: true,
    }
  }

  return {
    data: storeAccounts,
    isLoading: false,
    isApi: false,
  }
}

/**
 * Hook: Get budgets (API or Zustand)
 */
export function useBudgetData() {
  const isApi = useIsApiMode()
  const storeBudgets = useAppStore(s => s.budgets)
  const apiQuery = useBudgets()

  if (isApi && apiQuery.data) {
    return {
      data: apiQuery.data,
      isLoading: apiQuery.isLoading,
      isApi: true,
    }
  }

  return {
    data: storeBudgets,
    isLoading: false,
    isApi: false,
  }
}

/**
 * Hook: Get summary (API or Zustand)
 */
export function useSummaryData() {
  const isApi = useIsApiMode()
  const storeSummary = useAppStore(s => s.getSummary())
  const apiQuery = useSummary()

  if (isApi && apiQuery.data) {
    return {
      data: apiQuery.data,
      isLoading: apiQuery.isLoading,
      isApi: true,
    }
  }

  return {
    data: storeSummary,
    isLoading: false,
    isApi: false,
  }
}
