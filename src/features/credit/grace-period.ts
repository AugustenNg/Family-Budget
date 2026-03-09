// =============================================================================
// CFO Family Finance App — Credit Card Grace Period Calculator
// Logic tính chu kỳ sao kê và 45 ngày miễn lãi thẻ tín dụng
// =============================================================================

export interface CreditCardInfo {
  statementDay: number    // Ngày sao kê trong tháng (1-31)
  paymentDueDays: number  // Số ngày ân hạn sau sao kê (15-25 ngày)
  gracePeriodDays: number // Tổng ngày miễn lãi (thường 45-55)
}

export interface StatementCycle {
  cycleStart: Date        // Ngày bắt đầu chu kỳ sao kê
  cycleEnd: Date          // Ngày kết thúc chu kỳ (ngày sao kê)
  paymentDueDate: Date    // Hạn cuối thanh toán
  daysUntilStatement: number  // Số ngày đến ngày sao kê tiếp theo
  daysUntilPayment: number    // Số ngày đến hạn thanh toán
  isInGracePeriod: boolean    // Đang trong thời gian miễn lãi?
  effectiveGraceDays: number  // Số ngày miễn lãi thực tế cho giao dịch hôm nay
}

/**
 * Tính chu kỳ sao kê hiện tại và ngày đến hạn
 *
 * Logic:
 * - Nếu hôm nay < ngày sao kê: chu kỳ từ ngày sao kê tháng trước → ngày sao kê tháng này
 * - Nếu hôm nay >= ngày sao kê: chu kỳ từ ngày sao kê tháng này → ngày sao kê tháng sau
 */
export function getCurrentStatementCycle(
  card: CreditCardInfo,
  referenceDate: Date = new Date()
): StatementCycle {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let cycleEnd: Date
  let cycleStart: Date

  if (currentDay < card.statementDay) {
    // Chưa đến ngày sao kê tháng này
    cycleEnd = new Date(currentYear, currentMonth, card.statementDay)
    cycleStart = new Date(currentYear, currentMonth - 1, card.statementDay + 1)
  } else {
    // Đã qua ngày sao kê tháng này, sang chu kỳ mới
    cycleEnd = new Date(currentYear, currentMonth + 1, card.statementDay)
    cycleStart = new Date(currentYear, currentMonth, card.statementDay + 1)
  }

  // Ngày đến hạn = ngày sao kê của chu kỳ hiện tại + số ngày ân hạn
  // (Lưu ý: hạn thanh toán của chu kỳ TRƯỚC, không phải chu kỳ hiện tại)
  let statementDateForPayment: Date
  if (currentDay < card.statementDay) {
    statementDateForPayment = new Date(currentYear, currentMonth, card.statementDay)
  } else {
    statementDateForPayment = new Date(currentYear, currentMonth, card.statementDay)
  }
  const paymentDueDate = new Date(statementDateForPayment)
  paymentDueDate.setDate(paymentDueDate.getDate() + card.paymentDueDays)

  // Tính số ngày còn lại
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntilStatement = Math.ceil((cycleEnd.getTime() - today.getTime()) / msPerDay)
  const daysUntilPayment = Math.ceil((paymentDueDate.getTime() - today.getTime()) / msPerDay)

  // Kiểm tra có đang trong grace period không
  // Grace period: Từ ngày sao kê đến hạn thanh toán
  const isInGracePeriod = currentDay >= card.statementDay || daysUntilPayment > 0

  // Số ngày miễn lãi thực tế cho giao dịch được thực hiện hôm nay
  // = Ngày đến hạn thanh toán - Hôm nay
  const effectiveGraceDays = Math.max(0, daysUntilPayment + daysUntilStatement)

  return {
    cycleStart,
    cycleEnd,
    paymentDueDate,
    daysUntilStatement,
    daysUntilPayment,
    isInGracePeriod,
    effectiveGraceDays,
  }
}

/**
 * Tính số ngày miễn lãi cho một giao dịch cụ thể
 *
 * Ví dụ: Ngày sao kê 25, ân hạn 15 ngày
 * - Giao dịch ngày 1/3 → miễn lãi đến 09/04 = 39 ngày
 * - Giao dịch ngày 24/3 → miễn lãi đến 09/04 = 16 ngày
 * - Giao dịch ngày 26/3 → miễn lãi đến 09/05 = 44 ngày
 */
export function calculateGraceDaysForTransaction(
  card: CreditCardInfo,
  transactionDate: Date
): number {
  const txDate = new Date(transactionDate)
  txDate.setHours(0, 0, 0, 0)

  const txDay = txDate.getDate()
  const txMonth = txDate.getMonth()
  const txYear = txDate.getFullYear()

  let statementDate: Date
  if (txDay <= card.statementDay) {
    // Giao dịch trước ngày sao kê → sao kê tháng này
    statementDate = new Date(txYear, txMonth, card.statementDay)
  } else {
    // Giao dịch sau ngày sao kê → sao kê tháng sau
    statementDate = new Date(txYear, txMonth + 1, card.statementDay)
  }

  const paymentDueDate = new Date(statementDate)
  paymentDueDate.setDate(paymentDueDate.getDate() + card.paymentDueDays)

  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((paymentDueDate.getTime() - txDate.getTime()) / msPerDay)
}

/**
 * Kiểm tra xem thẻ có đang bị lãi không (chưa thanh toán đúng hạn)
 */
export function isChargingInterest(
  card: CreditCardInfo,
  lastPaymentDate: Date | null,
  lastStatementAmount: number
): boolean {
  if (!lastPaymentDate || lastStatementAmount <= 0) return false
  const cycle = getCurrentStatementCycle(card)
  return lastPaymentDate < cycle.paymentDueDate
}

/**
 * Tính lãi thẻ tín dụng nếu chỉ trả tối thiểu
 * @param balance Dư nợ
 * @param annualRate Lãi suất năm (e.g., 0.24 = 24%)
 * @param days Số ngày chịu lãi
 */
export function calculateCreditInterest(
  balance: number,
  annualRate: number,
  days: number
): number {
  const dailyRate = annualRate / 365
  return balance * dailyRate * days
}

/**
 * Format thông điệp cảnh báo thẻ tín dụng
 */
export function getCreditWarningMessage(cycle: StatementCycle): {
  level: 'safe' | 'warning' | 'danger'
  message: string
} {
  if (cycle.daysUntilPayment <= 0) {
    return {
      level: 'danger',
      message: '⚠️ Đã quá hạn thanh toán thẻ! Bạn đang bị tính lãi. Thanh toán ngay hôm nay.',
    }
  }
  if (cycle.daysUntilPayment <= 3) {
    return {
      level: 'danger',
      message: `🚨 Còn ${cycle.daysUntilPayment} ngày đến hạn thanh toán thẻ tín dụng!`,
    }
  }
  if (cycle.daysUntilPayment <= 7) {
    return {
      level: 'warning',
      message: `⏰ Còn ${cycle.daysUntilPayment} ngày đến hạn thanh toán thẻ. Đừng quên nhé!`,
    }
  }
  return {
    level: 'safe',
    message: `✅ Còn ${cycle.daysUntilPayment} ngày đến hạn thanh toán. Bạn đang yên tâm.`,
  }
}
