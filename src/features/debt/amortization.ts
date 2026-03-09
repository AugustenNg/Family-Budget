// =============================================================================
// CFO Family Finance App — Debt Amortization Calculator
// Tính bảng khấu hao và chiến lược trả nợ (Snowball / Avalanche)
// =============================================================================

export interface DebtInput {
  id: string
  name: string
  currentBalance: number
  interestRate: number    // Annual rate (e.g., 0.12 = 12%)
  monthlyPayment: number
}

export interface AmortizationRow {
  month: number
  date: Date
  openingBalance: number
  payment: number
  principal: number
  interest: number
  closingBalance: number
}

export interface DebtPayoffResult {
  debtId: string
  debtName: string
  schedule: AmortizationRow[]
  totalPayment: number
  totalInterest: number
  payoffDate: Date
  monthsToPayoff: number
}

// -----------------------------------------------------------------------------
// Bảng khấu hao 1 khoản nợ
// -----------------------------------------------------------------------------

/**
 * Tính bảng khấu hao (amortization schedule) cho một khoản nợ
 */
export function calculateAmortization(
  debt: DebtInput,
  startDate: Date = new Date()
): AmortizationRow[] {
  const monthlyRate = debt.interestRate / 12
  const schedule: AmortizationRow[] = []

  let balance = debt.currentBalance
  let month = 0
  const MAX_MONTHS = 480 // 40 năm tối đa

  while (balance > 0.01 && month < MAX_MONTHS) {
    month++
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + month - 1)

    const interest = balance * monthlyRate
    const payment = Math.min(debt.monthlyPayment, balance + interest)
    const principal = payment - interest

    const row: AmortizationRow = {
      month,
      date,
      openingBalance: balance,
      payment,
      principal: Math.max(0, principal),
      interest,
      closingBalance: Math.max(0, balance - Math.max(0, principal)),
    }

    schedule.push(row)
    balance = row.closingBalance
  }

  return schedule
}

/**
 * Tính kết quả trả nợ đầy đủ
 */
export function calculateDebtPayoff(
  debt: DebtInput,
  extraPayment: number = 0,
  startDate: Date = new Date()
): DebtPayoffResult {
  const adjustedDebt = {
    ...debt,
    monthlyPayment: debt.monthlyPayment + extraPayment,
  }

  const schedule = calculateAmortization(adjustedDebt, startDate)
  const lastRow = schedule[schedule.length - 1]

  return {
    debtId: debt.id,
    debtName: debt.name,
    schedule,
    totalPayment: schedule.reduce((sum, row) => sum + row.payment, 0),
    totalInterest: schedule.reduce((sum, row) => sum + row.interest, 0),
    payoffDate: lastRow.date,
    monthsToPayoff: schedule.length,
  }
}

// -----------------------------------------------------------------------------
// Chiến lược Snowball (Trả khoản nhỏ nhất trước)
// -----------------------------------------------------------------------------

/**
 * Snowball Strategy: Sắp xếp theo số dư từ nhỏ đến lớn
 * - Tạo động lực tâm lý vì trả xong từng khoản nhanh
 * - Số tiền freed-up từ khoản vừa trả xong → dồn vào khoản tiếp theo
 */
export function calculateSnowball(
  debts: DebtInput[],
  extraBudget: number = 0,
  startDate: Date = new Date()
): {
  order: string[]
  results: DebtPayoffResult[]
  totalInterest: number
  finalPayoffDate: Date
  savedVsMinimum: number
} {
  // Sắp xếp theo số dư tăng dần
  const sorted = [...debts].sort((a, b) => a.currentBalance - b.currentBalance)
  return executeStrategy(sorted, extraBudget, startDate, 'snowball')
}

// -----------------------------------------------------------------------------
// Chiến lược Avalanche (Trả lãi suất cao nhất trước)
// -----------------------------------------------------------------------------

/**
 * Avalanche Strategy: Sắp xếp theo lãi suất từ cao đến thấp
 * - Tiết kiệm tổng lãi phải trả nhiều nhất
 * - Tối ưu về mặt toán học
 */
export function calculateAvalanche(
  debts: DebtInput[],
  extraBudget: number = 0,
  startDate: Date = new Date()
): {
  order: string[]
  results: DebtPayoffResult[]
  totalInterest: number
  finalPayoffDate: Date
  savedVsMinimum: number
} {
  // Sắp xếp theo lãi suất giảm dần
  const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate)
  return executeStrategy(sorted, extraBudget, startDate, 'avalanche')
}

// -----------------------------------------------------------------------------
// Core Strategy Engine
// -----------------------------------------------------------------------------

function executeStrategy(
  sortedDebts: DebtInput[],
  extraBudget: number,
  startDate: Date,
  _strategy: 'snowball' | 'avalanche'
) {
  const workingDebts = sortedDebts.map(d => ({ ...d }))
  const results: Map<string, DebtPayoffResult> = new Map()
  const order = sortedDebts.map(d => d.id)

  let availableExtra = extraBudget
  let month = 0
  const MAX_MONTHS = 480

  // Track balances
  const balances = new Map(workingDebts.map(d => [d.id, d.currentBalance]))
  const monthlyInterest: Map<string, number[]> = new Map(workingDebts.map(d => [d.id, []]))

  while (month < MAX_MONTHS) {
    month++
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + month - 1)

    const activeDebts = workingDebts.filter(d => (balances.get(d.id) ?? 0) > 0.01)
    if (activeDebts.length === 0) break

    // Nếu khoản đầu tiên vừa được trả xong, thêm payment của nó vào extra
    let rollingExtra = availableExtra

    for (let i = 0; i < activeDebts.length; i++) {
      const debt = activeDebts[i]
      const balance = balances.get(debt.id) ?? 0
      const monthlyRate = debt.interestRate / 12
      const interest = balance * monthlyRate

      // Khoản đầu tiên (ưu tiên) nhận toàn bộ extra payment
      const payment = i === 0
        ? Math.min(debt.monthlyPayment + rollingExtra, balance + interest)
        : Math.min(debt.monthlyPayment, balance + interest)

      const principal = Math.max(0, payment - interest)
      const newBalance = Math.max(0, balance - principal)

      balances.set(debt.id, newBalance)
      monthlyInterest.get(debt.id)!.push(interest)

      // Nếu khoản này trả xong, giải phóng monthly payment cho khoản tiếp
      if (newBalance < 0.01) {
        rollingExtra += debt.monthlyPayment
      }
    }
  }

  // Build results
  for (const debt of workingDebts) {
    const schedule = calculateAmortization(
      { ...debt, monthlyPayment: debt.monthlyPayment + (debt === workingDebts[0] ? extraBudget : 0) },
      startDate
    )
    results.set(debt.id, {
      debtId: debt.id,
      debtName: debt.name,
      schedule,
      totalPayment: schedule.reduce((s, r) => s + r.payment, 0),
      totalInterest: schedule.reduce((s, r) => s + r.interest, 0),
      payoffDate: schedule[schedule.length - 1]?.date ?? startDate,
      monthsToPayoff: schedule.length,
    })
  }

  const allResults = Array.from(results.values())
  const totalInterest = allResults.reduce((s, r) => s + r.totalInterest, 0)
  const finalPayoffDate = allResults.reduce(
    (latest, r) => r.payoffDate > latest ? r.payoffDate : latest,
    startDate
  )

  // So sánh với trả minimum
  const minimumTotalInterest = workingDebts.reduce((sum, d) => {
    const minSchedule = calculateAmortization(d, startDate)
    return sum + minSchedule.reduce((s, r) => s + r.interest, 0)
  }, 0)

  return {
    order,
    results: allResults,
    totalInterest,
    finalPayoffDate,
    savedVsMinimum: minimumTotalInterest - totalInterest,
  }
}

// -----------------------------------------------------------------------------
// Comparison: Snowball vs Avalanche
// -----------------------------------------------------------------------------

/**
 * So sánh hai chiến lược để hiển thị gợi ý cho user
 */
export function compareStrategies(
  debts: DebtInput[],
  extraBudget: number = 0,
  startDate: Date = new Date()
) {
  const snowball = calculateSnowball(debts, extraBudget, startDate)
  const avalanche = calculateAvalanche(debts, extraBudget, startDate)

  const interestSavedByAvalanche = snowball.totalInterest - avalanche.totalInterest
  const monthsSavedByAvalanche = snowball.results.length > 0 && avalanche.results.length > 0
    ? Math.max(...snowball.results.map(r => r.monthsToPayoff)) -
      Math.max(...avalanche.results.map(r => r.monthsToPayoff))
    : 0

  return {
    snowball,
    avalanche,
    recommendation: interestSavedByAvalanche > 0 ? 'avalanche' : 'snowball',
    interestSavedByAvalanche,
    monthsSavedByAvalanche,
    message: interestSavedByAvalanche > 0
      ? `Chiến lược Avalanche giúp tiết kiệm ${interestSavedByAvalanche.toLocaleString('vi-VN')} ₫ tiền lãi so với Snowball`
      : `Hai chiến lược có kết quả tương đương. Snowball tạo động lực tốt hơn vì trả xong từng khoản nhanh hơn.`,
  }
}
