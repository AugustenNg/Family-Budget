// =============================================================================
// CFO Family Finance App — Financial Health Score Calculator
// Tính điểm sức khỏe tài chính gia đình (0-100)
// =============================================================================

export interface HealthScoreInput {
  // Thu nhập & Chi tiêu tháng này
  monthlyIncome: number
  monthlyExpense: number

  // Tiết kiệm
  monthlySavings: number
  emergencyFundMonths: number  // Quỹ khẩn cấp = bao nhiêu tháng chi tiêu

  // Nợ
  totalDebt: number
  monthlyDebtPayment: number

  // Đầu tư
  totalInvestment: number
  monthlyInvestment: number

  // Ngân sách
  budgetedCategories: number   // Số danh mục có ngân sách
  overBudgetCategories: number // Số danh mục vượt ngân sách
}

export interface HealthScoreResult {
  overallScore: number      // 0-100
  savingsScore: number      // Tỷ lệ tiết kiệm
  debtScore: number         // Gánh nặng nợ
  budgetScore: number       // Tuân thủ ngân sách
  emergencyScore: number    // Quỹ khẩn cấp
  investmentScore: number   // Đầu tư dài hạn
  cashflowScore: number     // Ổn định dòng tiền

  // Phân tích chi tiết
  savingsRate: number
  debtToIncomeRatio: number
  investmentRate: number
  budgetComplianceRate: number

  // Gợi ý cải thiện
  insights: HealthInsight[]
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  emoji: string
  message: string
}

export interface HealthInsight {
  category: string
  score: number
  status: 'good' | 'warning' | 'danger'
  suggestion: string
}

/**
 * Tính điểm sức khỏe tài chính tổng thể
 *
 * Trọng số:
 * - Tỷ lệ tiết kiệm: 25%
 * - Quỹ khẩn cấp: 20%
 * - Gánh nặng nợ: 20%
 * - Tuân thủ ngân sách: 15%
 * - Đầu tư dài hạn: 15%
 * - Ổn định dòng tiền: 5%
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const {
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    emergencyFundMonths,
    totalDebt,
    monthlyDebtPayment,
    totalInvestment,
    monthlyInvestment,
    budgetedCategories,
    overBudgetCategories,
  } = input

  // Prevent division by zero
  const income = Math.max(monthlyIncome, 1)

  // -------------------------------------------------------------------------
  // 1. Savings Score (Tỷ lệ tiết kiệm)
  // Chuẩn: >= 20% thu nhập → 100 điểm
  // -------------------------------------------------------------------------
  const savingsRate = monthlySavings / income
  let savingsScore: number
  if (savingsRate >= 0.30) savingsScore = 100
  else if (savingsRate >= 0.20) savingsScore = 85 + (savingsRate - 0.20) / 0.10 * 15
  else if (savingsRate >= 0.10) savingsScore = 60 + (savingsRate - 0.10) / 0.10 * 25
  else if (savingsRate >= 0.05) savingsScore = 30 + (savingsRate - 0.05) / 0.05 * 30
  else if (savingsRate > 0)    savingsScore = savingsRate / 0.05 * 30
  else savingsScore = 0
  savingsScore = Math.round(Math.max(0, Math.min(100, savingsScore)))

  // -------------------------------------------------------------------------
  // 2. Emergency Fund Score (Quỹ khẩn cấp)
  // Chuẩn: >= 6 tháng chi tiêu → 100 điểm
  // -------------------------------------------------------------------------
  let emergencyScore: number
  if (emergencyFundMonths >= 6) emergencyScore = 100
  else if (emergencyFundMonths >= 3) emergencyScore = 60 + (emergencyFundMonths - 3) / 3 * 40
  else if (emergencyFundMonths >= 1) emergencyScore = 20 + (emergencyFundMonths - 1) / 2 * 40
  else emergencyScore = emergencyFundMonths / 1 * 20
  emergencyScore = Math.round(Math.max(0, Math.min(100, emergencyScore)))

  // -------------------------------------------------------------------------
  // 3. Debt Score (Gánh nặng nợ)
  // DTI (Debt-to-Income): Khoản trả nợ hàng tháng / Thu nhập
  // Chuẩn: < 15% → tốt, 15-36% → trung bình, > 43% → nguy hiểm
  // -------------------------------------------------------------------------
  const debtToIncomeRatio = monthlyDebtPayment / income
  let debtScore: number
  if (debtToIncomeRatio === 0) debtScore = 100
  else if (debtToIncomeRatio <= 0.15) debtScore = 85 + (0.15 - debtToIncomeRatio) / 0.15 * 15
  else if (debtToIncomeRatio <= 0.36) debtScore = 40 + (0.36 - debtToIncomeRatio) / 0.21 * 45
  else if (debtToIncomeRatio <= 0.43) debtScore = 10 + (0.43 - debtToIncomeRatio) / 0.07 * 30
  else debtScore = Math.max(0, 10 - (debtToIncomeRatio - 0.43) * 100)
  debtScore = Math.round(Math.max(0, Math.min(100, debtScore)))

  // -------------------------------------------------------------------------
  // 4. Budget Score (Tuân thủ ngân sách)
  // -------------------------------------------------------------------------
  let budgetScore: number
  if (budgetedCategories === 0) {
    budgetScore = 20 // Chưa setup ngân sách
  } else {
    const complianceRate = 1 - (overBudgetCategories / budgetedCategories)
    budgetScore = Math.round(complianceRate * 100)
  }
  const budgetComplianceRate = budgetedCategories > 0
    ? 1 - (overBudgetCategories / budgetedCategories)
    : 0

  // -------------------------------------------------------------------------
  // 5. Investment Score (Đầu tư dài hạn)
  // Chuẩn: >= 10% thu nhập đầu tư → 100 điểm
  // -------------------------------------------------------------------------
  const investmentRate = monthlyInvestment / income
  let investmentScore: number
  if (investmentRate >= 0.20) investmentScore = 100
  else if (investmentRate >= 0.10) investmentScore = 70 + (investmentRate - 0.10) / 0.10 * 30
  else if (investmentRate >= 0.05) investmentScore = 40 + (investmentRate - 0.05) / 0.05 * 30
  else if (investmentRate > 0)    investmentScore = investmentRate / 0.05 * 40
  else investmentScore = totalInvestment > 0 ? 15 : 0 // Có đầu tư nhưng tháng này chưa thêm
  investmentScore = Math.round(Math.max(0, Math.min(100, investmentScore)))

  // -------------------------------------------------------------------------
  // 6. Cashflow Score (Ổn định dòng tiền)
  // -------------------------------------------------------------------------
  const cashflow = monthlyIncome - monthlyExpense
  let cashflowScore: number
  if (cashflow > monthlyIncome * 0.3) cashflowScore = 100
  else if (cashflow > 0) cashflowScore = 50 + (cashflow / (monthlyIncome * 0.3)) * 50
  else if (cashflow === 0) cashflowScore = 40
  else cashflowScore = Math.max(0, 40 + (cashflow / monthlyIncome) * 100)
  cashflowScore = Math.round(Math.max(0, Math.min(100, cashflowScore)))

  // -------------------------------------------------------------------------
  // Tính điểm tổng (weighted average)
  // -------------------------------------------------------------------------
  const overallScore = Math.round(
    savingsScore * 0.25 +
    emergencyScore * 0.20 +
    debtScore * 0.20 +
    budgetScore * 0.15 +
    investmentScore * 0.15 +
    cashflowScore * 0.05
  )

  // -------------------------------------------------------------------------
  // Level & Message
  // -------------------------------------------------------------------------
  let level: HealthScoreResult['level']
  let emoji: string
  let message: string

  if (overallScore >= 85) {
    level = 'excellent'; emoji = '🌟'
    message = 'Tài chính gia đình rất khỏe mạnh! Tiếp tục duy trì phong độ này.'
  } else if (overallScore >= 70) {
    level = 'good'; emoji = '💚'
    message = 'Tài chính đang tốt. Còn một vài điểm nhỏ có thể cải thiện.'
  } else if (overallScore >= 50) {
    level = 'fair'; emoji = '🟡'
    message = 'Tài chính ở mức trung bình. Cần chú ý một số vấn đề.'
  } else if (overallScore >= 30) {
    level = 'poor'; emoji = '🟠'
    message = 'Tài chính đang gặp khó khăn. Cần có kế hoạch cải thiện ngay.'
  } else {
    level = 'critical'; emoji = '🔴'
    message = 'Tình trạng tài chính nghiêm trọng. Cần hành động khẩn cấp!'
  }

  // -------------------------------------------------------------------------
  // Insights (Gợi ý cải thiện)
  // -------------------------------------------------------------------------
  const insights: HealthInsight[] = []

  if (savingsScore < 60) {
    insights.push({
      category: 'Tiết kiệm',
      score: savingsScore,
      status: savingsScore < 30 ? 'danger' : 'warning',
      suggestion: savingsRate < 0.05
        ? 'Bạn đang tiết kiệm rất ít. Hãy thử quy tắc 50/30/20: 50% nhu cầu, 30% mong muốn, 20% tiết kiệm.'
        : `Tỷ lệ tiết kiệm hiện tại ${(savingsRate * 100).toFixed(0)}%. Mục tiêu nên đạt 20%.`,
    })
  }

  if (emergencyScore < 60) {
    insights.push({
      category: 'Quỹ khẩn cấp',
      score: emergencyScore,
      status: emergencyFundMonths < 1 ? 'danger' : 'warning',
      suggestion: emergencyFundMonths < 1
        ? 'Bạn chưa có quỹ khẩn cấp. Bắt đầu ngay với mục tiêu 3 tháng chi tiêu!'
        : `Quỹ khẩn cấp hiện tại ${emergencyFundMonths} tháng. Nên đạt 6 tháng chi tiêu.`,
    })
  }

  if (debtScore < 60) {
    insights.push({
      category: 'Gánh nặng nợ',
      score: debtScore,
      status: debtToIncomeRatio > 0.43 ? 'danger' : 'warning',
      suggestion: `Bạn đang dành ${(debtToIncomeRatio * 100).toFixed(0)}% thu nhập để trả nợ. Cố gắng giảm xuống dưới 36%.`,
    })
  }

  if (budgetScore < 60) {
    insights.push({
      category: 'Ngân sách',
      score: budgetScore,
      status: overBudgetCategories > 3 ? 'danger' : 'warning',
      suggestion: budgetedCategories === 0
        ? 'Hãy setup ngân sách cho từng danh mục để kiểm soát chi tiêu tốt hơn.'
        : `${overBudgetCategories} danh mục đang vượt ngân sách. Xem xét lại kế hoạch chi tiêu.`,
    })
  }

  if (investmentScore < 40) {
    insights.push({
      category: 'Đầu tư',
      score: investmentScore,
      status: investmentRate === 0 ? 'warning' : 'warning',
      suggestion: investmentRate === 0
        ? 'Chưa có khoản đầu tư nào. Hãy bắt đầu với tiết kiệm ngân hàng hoặc quỹ mở.'
        : `Tỷ lệ đầu tư ${(investmentRate * 100).toFixed(0)}% thu nhập. Hướng tới mục tiêu 10-15%.`,
    })
  }

  return {
    overallScore,
    savingsScore,
    debtScore,
    budgetScore,
    emergencyScore,
    investmentScore,
    cashflowScore,
    savingsRate,
    debtToIncomeRatio,
    investmentRate,
    budgetComplianceRate,
    insights,
    level,
    emoji,
    message,
  }
}
