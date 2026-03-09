'use client'

import { useState } from 'react'
import type { Account } from '@/lib/mock-data'

interface FlipCardProps {
  account: Account
}

export function FlipCard({ account }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  const isCredit = account.type === 'CREDIT_CARD'
  const isSavings = account.type === 'SAVINGS'

  const balance = Math.abs(account.balance)
  const usedPercent = isCredit && account.creditLimit
    ? (Math.abs(account.balance) / account.creditLimit) * 100
    : 0

  return (
    <div
      className={`flip-card cursor-pointer select-none`}
      style={{ height: 160 }}
      onClick={e => { e.stopPropagation(); setFlipped(!flipped) }}
      title="Nhấn để lật thẻ"
    >
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
        {/* FRONT */}
        <div className={`flip-card-front bg-gradient-to-br ${account.gradient} p-5 flex flex-col justify-between`}>
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium">{getTypeLabel(account.type)}</p>
              <p className="text-white font-semibold text-sm mt-0.5">{account.name}</p>
            </div>
            <span className="text-2xl">{account.icon}</span>
          </div>

          {/* Balance */}
          <div>
            <p className="text-white/60 text-[10px] mb-0.5">
              {isCredit ? 'Dư nợ hiện tại' : 'Số dư'}
            </p>
            <p className="blur-sensitive font-num text-xl font-bold text-white">
              {isCredit && account.balance < 0 ? '-' : ''}
              {formatVND(balance)}
            </p>

            {/* Credit: used bar */}
            {isCredit && account.creditLimit && (
              <div className="mt-2">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(usedPercent, 100)}%`,
                      background: usedPercent > 80 ? '#ef4444' : 'rgba(255,255,255,0.8)',
                    }}
                  />
                </div>
                <p className="text-white/50 text-[10px] mt-0.5">
                  {usedPercent.toFixed(0)}% / {formatVNDShort(account.creditLimit)}
                </p>
              </div>
            )}

            {/* Savings: interest rate */}
            {isSavings && account.interestRate && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-white/60 text-xs">Lãi:</span>
                <span className="text-white text-xs font-semibold">{(account.interestRate * 100).toFixed(1)}%/năm</span>
              </div>
            )}
          </div>

          {/* Account number */}
          {account.accountNumber && (
            <p className="text-white/40 text-[10px] font-mono tracking-widest">
              **** **** **** {account.accountNumber}
            </p>
          )}

          {/* Flip hint */}
          <p className="absolute bottom-2 right-3 text-white/30 text-[9px]">Nhấn để lật ↩</p>
        </div>

        {/* BACK */}
        <div className={`flip-card-back bg-gradient-to-br ${account.gradient}`}
          style={{ filter: 'brightness(0.75)' }}
        >
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            {/* Magnetic strip */}
            <div className="w-full h-8 bg-black/50 rounded -mx-5 w-[calc(100%+40px)]" style={{ marginLeft: -20, marginRight: -20, width: 'calc(100% + 40px)' }} />

            <div className="flex flex-col gap-2">
              {isCredit && (
                <>
                  <InfoRow label="Hạn mức tín dụng" value={formatVND(account.creditLimit ?? 0)} />
                  <InfoRow label="Ngày sao kê" value={`${account.statementDay || '--'} hàng tháng`} />
                  <InfoRow label="Hạn thanh toán" value={`Sau ${account.paymentDueDays || 15} ngày sao kê`} />
                  <InfoRow label="Lãi suất" value={`${((account.interestRate ?? 0) * 100).toFixed(0)}%/năm`} />
                  <InfoRow label="Còn được dùng" value={formatVND((account.creditLimit ?? 0) - Math.abs(account.balance))} highlight />
                </>
              )}
              {!isCredit && (
                <>
                  <InfoRow label="Ngân hàng" value={account.bankName ?? 'N/A'} />
                  {account.accountNumber && <InfoRow label="Số tài khoản" value={`****${account.accountNumber}`} />}
                  {account.interestRate && <InfoRow label="Lãi suất" value={`${(account.interestRate * 100).toFixed(1)}%/năm`} />}
                  <InfoRow label="Số dư" value={formatVND(account.balance)} highlight />
                </>
              )}
            </div>

            <p className="text-white/30 text-[9px] text-right">Nhấn để lật lại ↩</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-[11px]">{label}</span>
      <span className={`font-num text-[11px] font-semibold ${highlight ? 'text-white' : 'text-white/80'} blur-sensitive`}>
        {value}
      </span>
    </div>
  )
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    BANK_ACCOUNT: 'Tài khoản ngân hàng',
    CASH: 'Tiền mặt',
    CREDIT_CARD: 'Thẻ tín dụng',
    SAVINGS: 'Tiết kiệm',
    INVESTMENT: 'Đầu tư',
    E_WALLET: 'Ví điện tử',
  }
  return map[type] ?? type
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}
function formatVNDShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}tr`
  return n.toLocaleString('vi-VN')
}
