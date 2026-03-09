// =============================================================================
// CFO Family Finance App — Format Utilities
// Hàm định dạng số tiền, ngày tháng, phần trăm cho toàn app
// =============================================================================

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'

// -----------------------------------------------------------------------------
// CURRENCY FORMATTING (Tiền tệ)
// -----------------------------------------------------------------------------

/**
 * Format số tiền VND
 * @example formatVND(1500000) → "1.500.000 ₫"
 */
export function formatVND(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format số tiền ngắn gọn (triệu, tỷ)
 * @example formatVNDShort(1500000) → "1,5tr"
 * @example formatVNDShort(2000000000) → "2 tỷ"
 */
export function formatVNDShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}tr`
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k`
  }
  return amount.toLocaleString('vi-VN')
}

/**
 * Format số tiền với dấu +/- rõ ràng
 * @example formatVNDSigned(150000) → "+150.000 ₫"
 * @example formatVNDSigned(-50000) → "-50.000 ₫"
 */
export function formatVNDSigned(amount: number): string {
  const formatted = formatVND(Math.abs(amount))
  return amount >= 0 ? `+${formatted}` : `-${formatted}`
}

/**
 * Format multi-currency
 */
export function formatCurrency(amount: number, currency: string = 'VND'): string {
  if (currency === 'VND') return formatVND(amount)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

// -----------------------------------------------------------------------------
// DATE FORMATTING (Ngày tháng)
// -----------------------------------------------------------------------------

/**
 * Format ngày dạng đầy đủ
 * @example formatDate(new Date()) → "Thứ Bảy, 08/03/2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'EEEE, dd/MM/yyyy', { locale: vi })
}

/**
 * Format ngày dạng ngắn
 * @example formatDateShort(new Date()) → "08/03/2026"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy')
}

/**
 * Format ngày dạng thông minh (Hôm nay, Hôm qua, hoặc ngày cụ thể)
 * @example formatDateSmart(today) → "Hôm nay"
 * @example formatDateSmart(yesterday) → "Hôm qua"
 * @example formatDateSmart(old) → "05/03/2026"
 */
export function formatDateSmart(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Hôm nay'
  if (isYesterday(d)) return 'Hôm qua'
  return formatDateShort(d)
}

/**
 * Format khoảng cách thời gian
 * @example formatRelative(past) → "3 giờ trước"
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { locale: vi, addSuffix: true })
}

/**
 * Format tháng/năm
 * @example formatMonth(new Date()) → "Tháng 3, 2026"
 */
export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "'Tháng' M, yyyy", { locale: vi })
}

// -----------------------------------------------------------------------------
// PERCENTAGE FORMATTING (Phần trăm)
// -----------------------------------------------------------------------------

/**
 * Format phần trăm
 * @example formatPercent(0.2456) → "24.56%"
 * @example formatPercent(0.2456, 0) → "25%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format phần trăm từ 0-100 (không nhân 100)
 */
export function formatPercentDirect(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

// -----------------------------------------------------------------------------
// NUMBER FORMATTING (Số)
// -----------------------------------------------------------------------------

/**
 * Format số có dấu phân cách ngàn
 * @example formatNumber(1234567) → "1.234.567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

// -----------------------------------------------------------------------------
// ACCOUNT MASKING (Che thông tin thẻ)
// -----------------------------------------------------------------------------

/**
 * Che số thẻ ngân hàng
 * @example maskAccountNumber("1234") → "**** **** **** 1234"
 */
export function maskAccountNumber(last4: string): string {
  return `**** **** **** ${last4}`
}

// -----------------------------------------------------------------------------
// CREDIT CARD HELPERS
// -----------------------------------------------------------------------------

/**
 * Tính ngày đến hạn thanh toán thẻ tín dụng
 * @param statementDay Ngày sao kê (1-31)
 * @param paymentDueDays Số ngày ân hạn (thường 15-25)
 */
export function calculatePaymentDueDate(
  statementDay: number,
  paymentDueDays: number,
  referenceDate: Date = new Date()
): Date {
  const now = referenceDate
  let statementDate = new Date(now.getFullYear(), now.getMonth(), statementDay)

  // Nếu ngày sao kê đã qua trong tháng này, dùng tháng tiếp theo
  if (now.getDate() > statementDay) {
    statementDate = new Date(now.getFullYear(), now.getMonth() + 1, statementDay)
  }

  const dueDate = new Date(statementDate)
  dueDate.setDate(dueDate.getDate() + paymentDueDays)
  return dueDate
}

/**
 * Tính số ngày còn lại đến hạn
 */
export function daysUntilDue(dueDate: Date): number {
  const today = new Date()
  const diff = dueDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
