// =============================================================================
// CFO Family Finance App — Zustand Store (Phase 1: Client-side state)
// =============================================================================
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  mockAccounts, mockTransactions, mockBudgets, mockDebts,
  type Account, type Transaction, type Budget, type Debt,
} from './mock-data'

// ---- Extra types not in mock-data ----
export interface Investment {
  id: string
  name: string
  type: string
  amount: number
  current: number
  rate: number
  icon: string
  color: string
}

export interface Goal {
  id: string
  name: string
  icon: string
  target: number
  current: number
  date: string   // ISO date string (YYYY-MM-DD)
  color: string
}

export interface Summary {
  monthlyIncome: number
  monthlyExpense: number
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  liquidAssets: number
  savingsRate: number
  budgetCompliance: number
  healthScore: number
}

export interface NewTransaction {
  accountId: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  description: string
  categoryName: string
  categoryIcon: string
  tags?: string[]
}

// ---- Seed data for investments & goals (from wealth/page.tsx) ----
const INIT_INVESTMENTS: Investment[] = [
  { id: 'inv-1', name: 'Tiết kiệm ACB 12 tháng', type: 'SAVINGS_TERM', amount: 80_000_000, current: 82_600_000, rate: 0.065, icon: '🐷', color: '#84cc16' },
  { id: 'inv-2', name: 'Cổ phiếu VNM', type: 'STOCK', amount: 25_000_000, current: 28_500_000, rate: 0.14, icon: '📊', color: '#10b981' },
  { id: 'inv-3', name: 'Quỹ mở VNINDEX', type: 'FUND', amount: 15_000_000, current: 16_200_000, rate: 0.08, icon: '📈', color: '#6366f1' },
]

const INIT_GOALS: Goal[] = [
  { id: 'goal-1', name: 'Du lịch Nhật Bản 2027', icon: '✈️', target: 80_000_000, current: 32_000_000, date: '2027-03-01', color: '#6366f1' },
  { id: 'goal-2', name: 'Mua xe mới 2028', icon: '🚗', target: 600_000_000, current: 150_000_000, date: '2028-01-01', color: '#f59e0b' },
  { id: 'goal-3', name: 'Quỹ giáo dục con', icon: '🎓', target: 500_000_000, current: 85_000_000, date: '2035-01-01', color: '#10b981' },
]

// ---- Category → budget categoryId mapping ----
export const CATEGORY_BUDGET_MAP: Record<string, string> = {
  'Ăn uống': 'c-food',
  'Ăn ngoài': 'c-food',
  'Di chuyển': 'c-move',
  'Xăng dầu': 'c-move',
  'Mua sắm': 'c-shop',
  'Giải trí': 'c-fun',
  'Cà phê': 'c-fun',
  'Điện nước': 'c-house',
  'Điện': 'c-house',
  'Internet': 'c-house',
  'Nhà ở & Tiện ích': 'c-house',
  'Sức khỏe': 'c-health',
  'Gym': 'c-health',
  'Học phí': 'c-edu',
  'Học phí con': 'c-edu',
  'Giáo dục & Con cái': 'c-edu',
  'Hỗ trợ gia đình': 'c-family',
  'Biếu bố mẹ': 'c-family',
}

// ---- All available categories for forms ----
export const ALL_CATEGORIES = [
  { name: 'Ăn uống', icon: '🍜', budgetId: 'c-food' },
  { name: 'Di chuyển', icon: '🚗', budgetId: 'c-move' },
  { name: 'Mua sắm', icon: '🛍️', budgetId: 'c-shop' },
  { name: 'Giải trí', icon: '🎮', budgetId: 'c-fun' },
  { name: 'Điện nước', icon: '⚡', budgetId: 'c-house' },
  { name: 'Sức khỏe', icon: '💊', budgetId: 'c-health' },
  { name: 'Giáo dục', icon: '🎒', budgetId: 'c-edu' },
  { name: 'Hỗ trợ gia đình', icon: '❤️', budgetId: 'c-family' },
  { name: 'Lương', icon: '💼', budgetId: null },
  { name: 'Thu nhập phụ', icon: '💵', budgetId: null },
  { name: 'Khác', icon: '📦', budgetId: null },
]

// ---- Budget category metadata (for AddBudgetModal) ----
export const BUDGET_CATEGORIES = [
  { id: 'c-food', name: 'Ăn uống', icon: '🍜', color: '#ef4444' },
  { id: 'c-house', name: 'Nhà ở & Tiện ích', icon: '🏠', color: '#f59e0b' },
  { id: 'c-move', name: 'Di chuyển', icon: '🚗', color: '#8b5cf6' },
  { id: 'c-edu', name: 'Giáo dục & Con cái', icon: '📚', color: '#06b6d4' },
  { id: 'c-shop', name: 'Mua sắm', icon: '🛍️', color: '#f97316' },
  { id: 'c-health', name: 'Sức khỏe', icon: '🏥', color: '#ec4899' },
  { id: 'c-fun', name: 'Giải trí', icon: '🎮', color: '#a855f7' },
  { id: 'c-family', name: 'Hỗ trợ gia đình', icon: '❤️', color: '#84cc16' },
  { id: 'c-other', name: 'Khác', icon: '📦', color: '#94a3b8' },
]

// ---- Helpers ----
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ---- Store interface ----
interface AppStore {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  debts: Debt[]
  investments: Investment[]
  goals: Goal[]

  // Transaction CRUD
  addTransaction: (tx: NewTransaction) => void
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => void
  deleteTransaction: (id: string) => void

  // Account CRUD
  addAccount: (acc: Omit<Account, 'id'>) => void
  updateAccount: (id: string, patch: Partial<Account>) => void

  // Budget CRUD
  addBudget: (b: Omit<Budget, 'id'>) => void
  updateBudget: (id: string, patch: Partial<Budget>) => void
  deleteBudget: (id: string) => void

  // Debt
  addDebt: (d: Omit<Debt, 'id'>) => void

  // Investment
  addInvestment: (inv: Omit<Investment, 'id'>) => void

  // Goal
  addGoal: (g: Omit<Goal, 'id'>) => void
  contributeToGoal: (goalId: string, amount: number, fromAccountId?: string) => void

  // Computed
  getSummary: () => Summary
}

// ---- Store implementation ----
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ---- Initial state ----
      accounts: mockAccounts,
      transactions: mockTransactions,
      budgets: mockBudgets,
      debts: mockDebts,
      investments: INIT_INVESTMENTS,
      goals: INIT_GOALS,

      // ---- Transaction CRUD ----
      addTransaction: (tx) => set((state) => {
        const account = state.accounts.find(a => a.id === tx.accountId)
        const accountName = account?.name ?? ''

        const newTx: Transaction = {
          id: genId(),
          accountId: tx.accountId,
          accountName,
          categoryId: CATEGORY_BUDGET_MAP[tx.categoryName] ?? 'c-other',
          categoryName: tx.categoryName,
          categoryIcon: tx.categoryIcon,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          date: new Date(),
          tags: tx.tags,
        }

        // Update account balance
        const updatedAccounts = state.accounts.map(a => {
          if (a.id !== tx.accountId) return a
          if (tx.type === 'INCOME') return { ...a, balance: a.balance + tx.amount }
          if (tx.type === 'EXPENSE' || tx.type === 'TRANSFER') return { ...a, balance: a.balance - tx.amount }
          return a
        })

        // Update budget spent
        let updatedBudgets = state.budgets
        if (tx.type === 'EXPENSE') {
          const budgetCatId = CATEGORY_BUDGET_MAP[tx.categoryName]
          if (budgetCatId) {
            updatedBudgets = state.budgets.map(b =>
              b.categoryId === budgetCatId ? { ...b, spent: b.spent + tx.amount } : b
            )
          }
        }

        return {
          transactions: [newTx, ...state.transactions],
          accounts: updatedAccounts,
          budgets: updatedBudgets,
        }
      }),

      updateTransaction: (id, patch) => set((state) => {
        const oldTx = state.transactions.find(t => t.id === id)
        if (!oldTx) return state

        // Reverse old side-effects on accounts
        let accounts = state.accounts.map(a => {
          if (a.id !== oldTx.accountId) return a
          if (oldTx.type === 'INCOME') return { ...a, balance: a.balance - oldTx.amount }
          if (oldTx.type === 'EXPENSE' || oldTx.type === 'TRANSFER') return { ...a, balance: a.balance + oldTx.amount }
          return a
        })
        // Reverse old side-effects on budgets
        let budgets = state.budgets
        if (oldTx.type === 'EXPENSE') {
          const catId = CATEGORY_BUDGET_MAP[oldTx.categoryName]
          if (catId) budgets = budgets.map(b => b.categoryId === catId ? { ...b, spent: Math.max(0, b.spent - oldTx.amount) } : b)
        }

        const updatedTx = { ...oldTx, ...patch }

        // Apply new side-effects on accounts
        accounts = accounts.map(a => {
          if (a.id !== updatedTx.accountId) return a
          if (updatedTx.type === 'INCOME') return { ...a, balance: a.balance + updatedTx.amount }
          if (updatedTx.type === 'EXPENSE' || updatedTx.type === 'TRANSFER') return { ...a, balance: a.balance - updatedTx.amount }
          return a
        })
        // Apply new side-effects on budgets
        if (updatedTx.type === 'EXPENSE') {
          const catId = CATEGORY_BUDGET_MAP[updatedTx.categoryName]
          if (catId) budgets = budgets.map(b => b.categoryId === catId ? { ...b, spent: b.spent + updatedTx.amount } : b)
        }

        return {
          transactions: state.transactions.map(t => t.id === id ? updatedTx : t),
          accounts,
          budgets,
        }
      }),

      deleteTransaction: (id) => set((state) => {
        const tx = state.transactions.find(t => t.id === id)
        if (!tx) return state

        const accounts = state.accounts.map(a => {
          if (a.id !== tx.accountId) return a
          if (tx.type === 'INCOME') return { ...a, balance: a.balance - tx.amount }
          if (tx.type === 'EXPENSE' || tx.type === 'TRANSFER') return { ...a, balance: a.balance + tx.amount }
          return a
        })

        let budgets = state.budgets
        if (tx.type === 'EXPENSE') {
          const catId = CATEGORY_BUDGET_MAP[tx.categoryName]
          if (catId) budgets = budgets.map(b => b.categoryId === catId ? { ...b, spent: Math.max(0, b.spent - tx.amount) } : b)
        }

        return {
          transactions: state.transactions.filter(t => t.id !== id),
          accounts,
          budgets,
        }
      }),

      // ---- Account CRUD ----
      addAccount: (acc) => set((state) => ({
        accounts: [...state.accounts, { ...acc, id: genId() }],
      })),

      updateAccount: (id, patch) => set((state) => ({
        accounts: state.accounts.map(a => a.id === id ? { ...a, ...patch } : a),
      })),

      // ---- Budget CRUD ----
      addBudget: (b) => set((state) => {
        // Prevent duplicate categories — find first category not yet budgeted
        const existingCatIds = new Set(state.budgets.map(x => x.categoryId))
        // If provided categoryId already exists, find the first truly available one
        let finalCatId = b.categoryId
        if (existingCatIds.has(finalCatId)) {
          const available = BUDGET_CATEGORIES.find(c => !existingCatIds.has(c.id))
          if (!available) return state // all categories budgeted, no-op
          finalCatId = available.id
        }
        // Ensure category metadata is correct from BUDGET_CATEGORIES
        const catMeta = BUDGET_CATEGORIES.find(c => c.id === finalCatId)
        const newBudget: Budget = {
          id: genId(),
          categoryId: finalCatId,
          categoryName: catMeta?.name ?? b.categoryName,
          categoryIcon: catMeta?.icon ?? b.categoryIcon,
          color: catMeta?.color ?? b.color,
          budgeted: b.budgeted,
          spent: b.spent ?? 0,
        }
        return { budgets: [...state.budgets, newBudget] }
      }),

      updateBudget: (id, patch) => set((state) => ({
        budgets: state.budgets.map(b => b.id === id ? { ...b, ...patch } : b),
      })),

      deleteBudget: (id) => set((state) => ({
        budgets: state.budgets.filter(b => b.id !== id),
      })),

      // ---- Debt ----
      addDebt: (d) => set((state) => ({
        debts: [...state.debts, { ...d, id: genId() }],
      })),

      // ---- Investment ----
      addInvestment: (inv) => set((state) => ({
        investments: [...state.investments, { ...inv, id: genId() }],
      })),

      // ---- Goal ----
      addGoal: (g) => set((state) => ({
        goals: [...state.goals, { ...g, id: genId() }],
      })),

      contributeToGoal: (goalId, amount, fromAccountId) => set((state) => {
        const goals = state.goals.map(g => g.id === goalId ? { ...g, current: Math.min(g.current + amount, g.target) } : g)
        const accounts = fromAccountId
          ? state.accounts.map(a => a.id === fromAccountId ? { ...a, balance: a.balance - amount } : a)
          : state.accounts
        // Also add a transfer transaction
        const fromAccount = state.accounts.find(a => a.id === fromAccountId)
        const goal = state.goals.find(g => g.id === goalId)
        const txEntry: Transaction | null = fromAccountId && fromAccount && goal ? {
          id: genId(),
          accountId: fromAccountId,
          accountName: fromAccount.name,
          categoryId: 'c-save',
          categoryName: 'Tiết kiệm',
          categoryIcon: '🐷',
          type: 'TRANSFER',
          amount,
          description: `Đóng góp mục tiêu: ${goal.name}`,
          date: new Date(),
        } : null
        return {
          goals,
          accounts,
          transactions: txEntry ? [txEntry, ...state.transactions] : state.transactions,
        }
      }),

      // ---- Computed summary ----
      getSummary: () => {
        const state = get()
        const now = new Date()
        const thisMonthTxs = state.transactions.filter(tx => {
          const d = new Date(tx.date)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        const monthlyIncome = thisMonthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
        const monthlyExpense = thisMonthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
        const totalAssets = state.accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
        const totalLiabilities = state.debts.reduce((s, d) => s + d.currentBalance, 0)
        const netWorth = totalAssets - totalLiabilities
        const liquidAssets = state.accounts
          .filter(a => ['BANK_ACCOUNT', 'CASH', 'E_WALLET'].includes(a.type) && a.balance > 0)
          .reduce((s, a) => s + a.balance, 0)
        const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0
        const onBudget = state.budgets.filter(b => b.spent <= b.budgeted).length
        const budgetCompliance = state.budgets.length > 0 ? onBudget / state.budgets.length : 1
        const healthScore = Math.min(100, Math.max(0, Math.round(
          Math.max(0, savingsRate) * 40 +
          budgetCompliance * 30 +
          (totalAssets > totalLiabilities * 0.1 ? 30 : 10)
        )))
        return { monthlyIncome, monthlyExpense, totalAssets, totalLiabilities, netWorth, liquidAssets, savingsRate, budgetCompliance, healthScore }
      },
    }),
    {
      name: 'cfo-family-store-v1',
      storage: createJSONStorage(() => localStorage),
      // Revive Date objects after JSON deserialization
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.transactions = state.transactions.map(tx => ({
          ...tx,
          date: new Date(tx.date),
        }))
        state.debts = state.debts.map(d => ({
          ...d,
          startDate: new Date(d.startDate),
          endDate: new Date(d.endDate),
        }))
      },
    }
  )
)
