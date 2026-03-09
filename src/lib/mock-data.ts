// =============================================================================
// Mock data cho UI development (thay thế bằng API calls sau)
// =============================================================================

export type AccountType = 'BANK_ACCOUNT' | 'CASH' | 'CREDIT_CARD' | 'SAVINGS' | 'INVESTMENT' | 'E_WALLET'
export type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'CREDIT_PAYMENT'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  creditLimit?: number
  statementDay?: number
  paymentDueDays?: number
  interestRate?: number
  bankName?: string
  accountNumber?: string
  icon: string
  color: string
  gradient: string
}

export interface Transaction {
  id: string
  accountId: string
  accountName: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  type: TxType
  amount: number
  description: string
  date: Date
  tags?: string[]
}

export interface Budget {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  color: string
  budgeted: number
  spent: number
}

export interface Debt {
  id: string
  name: string
  type: string
  lenderName: string
  originalAmount: number
  currentBalance: number
  interestRate: number
  monthlyPayment: number
  startDate: Date
  endDate: Date
  color: string
}

// ---- ACCOUNTS ----
export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Vietcombank',
    type: 'BANK_ACCOUNT',
    balance: 45_200_000,
    bankName: 'Vietcombank',
    accountNumber: '3421',
    icon: '🏦',
    color: '#10b981',
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'acc-2',
    name: 'Ví tiền mặt',
    type: 'CASH',
    balance: 3_500_000,
    icon: '💵',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'acc-3',
    name: 'TCB Visa Platinum',
    type: 'CREDIT_CARD',
    balance: -8_200_000,
    creditLimit: 50_000_000,
    statementDay: 25,
    paymentDueDays: 15,
    interestRate: 0.24,
    bankName: 'Techcombank',
    accountNumber: '8812',
    icon: '💳',
    color: '#ef4444',
    gradient: 'from-red-600 to-rose-700',
  },
  {
    id: 'acc-4',
    name: 'MBBank (Vợ)',
    type: 'BANK_ACCOUNT',
    balance: 12_000_000,
    bankName: 'MBBank',
    accountNumber: '5678',
    icon: '🏦',
    color: '#6366f1',
    gradient: 'from-indigo-600 to-violet-700',
  },
  {
    id: 'acc-5',
    name: 'Tiết kiệm ACB 12T',
    type: 'SAVINGS',
    balance: 80_000_000,
    interestRate: 0.065,
    bankName: 'ACB',
    icon: '🐷',
    color: '#84cc16',
    gradient: 'from-lime-600 to-green-700',
  },
]

// ---- TRANSACTIONS ----
const today = new Date()
const d = (daysAgo: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() - daysAgo)
  return date
}

export const mockTransactions: Transaction[] = [
  { id: 't1', accountId: 'acc-1', accountName: 'VCB', categoryId: 'c1', categoryName: 'Lương chính', categoryIcon: '💼', type: 'INCOME', amount: 25_000_000, description: 'Lương tháng 3/2026', date: d(0) },
  { id: 't2', accountId: 'acc-4', accountName: 'MBBank', categoryId: 'c2', categoryName: 'Lương chính', categoryIcon: '💼', type: 'INCOME', amount: 20_000_000, description: 'Lương tháng 3 - Vợ', date: d(0) },
  { id: 't3', accountId: 'acc-3', accountName: 'TCB Visa', categoryId: 'c3', categoryName: 'Ăn ngoài', categoryIcon: '🍽️', type: 'EXPENSE', amount: 450_000, description: 'Bữa tối nhà hàng Hải Sản', date: d(1) },
  { id: 't4', accountId: 'acc-3', accountName: 'TCB Visa', categoryId: 'c4', categoryName: 'Mua sắm', categoryIcon: '🛍️', type: 'EXPENSE', amount: 1_200_000, description: 'Shopee - Đồ gia dụng', date: d(1) },
  { id: 't5', accountId: 'acc-2', accountName: 'Ví tiền mặt', categoryId: 'c5', categoryName: 'Ăn ngoài', categoryIcon: '🍜', type: 'EXPENSE', amount: 85_000, description: 'Bún bò buổi sáng', date: d(2) },
  { id: 't6', accountId: 'acc-1', accountName: 'VCB', categoryId: 'c6', categoryName: 'Điện', categoryIcon: '⚡', type: 'EXPENSE', amount: 680_000, description: 'Hóa đơn điện tháng 2', date: d(2) },
  { id: 't7', accountId: 'acc-1', accountName: 'VCB', categoryId: 'c7', categoryName: 'Internet', categoryIcon: '📡', type: 'EXPENSE', amount: 220_000, description: 'Cước internet VNPT', date: d(3) },
  { id: 't8', accountId: 'acc-3', accountName: 'TCB Visa', categoryId: 'c8', categoryName: 'Cà phê', categoryIcon: '☕', type: 'EXPENSE', amount: 120_000, description: 'Highlands Coffee x2', date: d(3) },
  { id: 't9', accountId: 'acc-1', accountName: 'VCB', categoryId: 'c9', categoryName: 'Xăng dầu', categoryIcon: '⛽', type: 'EXPENSE', amount: 350_000, description: 'Đổ xăng xe máy', date: d(4) },
  { id: 't10', accountId: 'acc-3', accountName: 'TCB Visa', categoryId: 'c10', categoryName: 'Gym', categoryIcon: '💪', type: 'EXPENSE', amount: 500_000, description: 'Phí gym tháng 3', date: d(4) },
  { id: 't11', accountId: 'acc-1', accountName: 'VCB', categoryId: 'c11', categoryName: 'Tiết kiệm', categoryIcon: '🐷', type: 'TRANSFER', amount: 10_000_000, description: 'Chuyển tiết kiệm tháng 3', date: d(5) },
  { id: 't12', accountId: 'acc-4', accountName: 'MBBank', categoryId: 'c12', categoryName: 'Biếu bố mẹ', categoryIcon: '❤️', type: 'EXPENSE', amount: 3_000_000, description: 'Biếu ba mẹ hàng tháng', date: d(5) },
  { id: 't13', accountId: 'acc-3', accountName: 'TCB Visa', categoryId: 'c13', categoryName: 'Ăn ngoài', categoryIcon: '🍜', type: 'EXPENSE', amount: 280_000, description: 'Cơm văn phòng cả tuần', date: d(6) },
  { id: 't14', accountId: 'acc-2', accountName: 'Ví tiền mặt', categoryId: 'c14', categoryName: 'Học phí con', categoryIcon: '🎒', type: 'EXPENSE', amount: 4_500_000, description: 'Học phí lớp 1 tháng 3', date: d(7) },
  { id: 't15', accountId: 'acc-1', accountName: 'VCB', categoryId: 'c15', categoryName: 'Thu nhập phụ', categoryIcon: '💵', type: 'INCOME', amount: 3_500_000, description: 'Freelance thiết kế logo', date: d(7) },
]

// ---- BUDGETS ----
export const mockBudgets: Budget[] = [
  { id: 'b1', categoryId: 'c-food', categoryName: 'Ăn uống', categoryIcon: '🍜', color: '#ef4444', budgeted: 8_000_000, spent: 6_840_000 },
  { id: 'b2', categoryId: 'c-house', categoryName: 'Nhà ở & Tiện ích', categoryIcon: '🏠', color: '#f59e0b', budgeted: 5_000_000, spent: 2_150_000 },
  { id: 'b3', categoryId: 'c-move', categoryName: 'Di chuyển', categoryIcon: '🚗', color: '#8b5cf6', budgeted: 2_000_000, spent: 1_850_000 },
  { id: 'b4', categoryId: 'c-edu', categoryName: 'Giáo dục & Con cái', categoryIcon: '📚', color: '#06b6d4', budgeted: 6_000_000, spent: 6_200_000 },
  { id: 'b5', categoryId: 'c-shop', categoryName: 'Mua sắm', categoryIcon: '🛍️', color: '#f97316', budgeted: 3_000_000, spent: 1_200_000 },
  { id: 'b6', categoryId: 'c-health', categoryName: 'Sức khỏe', categoryIcon: '🏥', color: '#ec4899', budgeted: 1_500_000, spent: 500_000 },
  { id: 'b7', categoryId: 'c-fun', categoryName: 'Giải trí', categoryIcon: '🎮', color: '#a855f7', budgeted: 1_000_000, spent: 620_000 },
  { id: 'b8', categoryId: 'c-family', categoryName: 'Hỗ trợ gia đình', categoryIcon: '❤️', color: '#84cc16', budgeted: 4_000_000, spent: 3_000_000 },
]

// ---- DEBTS ----
export const mockDebts: Debt[] = [
  {
    id: 'd1',
    name: 'Vay mua nhà',
    type: 'MORTGAGE',
    lenderName: 'Vietcombank',
    originalAmount: 1_800_000_000,
    currentBalance: 1_620_000_000,
    interestRate: 0.085,
    monthlyPayment: 15_800_000,
    startDate: new Date('2023-01-15'),
    endDate: new Date('2033-01-15'),
    color: '#ef4444',
  },
  {
    id: 'd2',
    name: 'Vay mua xe',
    type: 'CAR_LOAN',
    lenderName: 'Techcombank',
    originalAmount: 450_000_000,
    currentBalance: 280_000_000,
    interestRate: 0.092,
    monthlyPayment: 9_500_000,
    startDate: new Date('2022-06-01'),
    endDate: new Date('2027-06-01'),
    color: '#f59e0b',
  },
]

// ---- SUMMARY (for Dashboard) ----
export const mockSummary = {
  monthlyIncome: 48_500_000,
  monthlyExpense: 28_370_000,
  totalAssets: 140_700_000,
  totalLiabilities: 1_908_200_000,
  netWorth: -1_767_500_000, // Âm vì nhà + xe
  liquidAssets: 60_700_000,  // Không tính tiết kiệm + đầu tư
  healthScore: 72,
  savingsRate: 0.22,
  budgetCompliance: 0.78,
}

// Net worth history (12 months)
export const mockNetWorthHistory = [
  { month: 'T4/25', assets: 95_000_000, liabilities: 1_980_000_000, net: -1_885_000_000 },
  { month: 'T5/25', assets: 102_000_000, liabilities: 1_965_000_000, net: -1_863_000_000 },
  { month: 'T6/25', assets: 108_000_000, liabilities: 1_950_000_000, net: -1_842_000_000 },
  { month: 'T7/25', assets: 112_000_000, liabilities: 1_936_000_000, net: -1_824_000_000 },
  { month: 'T8/25', assets: 118_000_000, liabilities: 1_922_000_000, net: -1_804_000_000 },
  { month: 'T9/25', assets: 121_000_000, liabilities: 1_908_000_000, net: -1_787_000_000 },
  { month: 'T10/25', assets: 125_000_000, liabilities: 1_930_000_000, net: -1_805_000_000 },
  { month: 'T11/25', assets: 128_000_000, liabilities: 1_920_000_000, net: -1_792_000_000 },
  { month: 'T12/25', assets: 132_000_000, liabilities: 1_913_000_000, net: -1_781_000_000 },
  { month: 'T1/26', assets: 135_000_000, liabilities: 1_913_000_000, net: -1_778_000_000 },
  { month: 'T2/26', assets: 137_000_000, liabilities: 1_910_000_000, net: -1_773_000_000 },
  { month: 'T3/26', assets: 140_700_000, liabilities: 1_908_200_000, net: -1_767_500_000 },
]
