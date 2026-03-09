'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAppStore, type Goal } from '@/lib/store'
import { calculateAmortization } from '@/features/debt/amortization'

type Tab = 'debt' | 'investment' | 'goals'

export default function WealthPage() {
  const summary = useAppStore(s => s.getSummary())
  const [tab, setTab] = useState<Tab>('debt')

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'debt', label: 'Quản lý Nợ', icon: '🔴' },
    { key: 'investment', label: 'Đầu tư', icon: '📈' },
    { key: 'goals', label: 'Mục tiêu', icon: '🎯' },
  ]

  return (
    <div className="animate-fade-in">
      <Topbar title="Tài sản & Nợ" subtitle="Phá băng nợ và xây dựng khối tài sản" />

      {/* Net Worth Summary */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">Tổng tài sản</p>
            <p className="blur-sensitive font-num text-2xl font-bold text-emerald-400">
              {fmtShort(summary.totalAssets)}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">+5.7tr so với tháng trước</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Tổng nợ</p>
            <p className="blur-sensitive font-num text-2xl font-bold text-red-400">
              {fmtShort(summary.totalLiabilities)}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">Giảm 25.3tr so với tháng trước</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Tài sản ròng</p>
            <p className={`blur-sensitive font-num text-2xl font-bold ${summary.netWorth >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {fmtShort(summary.netWorth)}
            </p>
            {summary.totalLiabilities > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min((summary.totalAssets / summary.totalLiabilities) * 100, 100)}%` }} />
                </div>
                <span className="text-[10px] text-slate-600">
                  {((summary.totalAssets / summary.totalLiabilities) * 100).toFixed(1)}% phủ nợ
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-white/[0.06] pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${tab === t.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'debt' && <DebtTab />}
      {tab === 'investment' && <InvestmentTab />}
      {tab === 'goals' && <GoalsTab />}
    </div>
  )
}

// ============================================================
// DEBT TAB
// ============================================================
function DebtTab() {
  const debts = useAppStore(s => s.debts)
  const addDebt = useAppStore(s => s.addDebt)
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche')
  const [showAdd, setShowAdd] = useState(false)
  const [amortDebtId, setAmortDebtId] = useState<string | null>(null)

  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0)
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0)

  const sorted = [...debts].sort((a, b) =>
    strategy === 'avalanche'
      ? b.interestRate - a.interestRate
      : a.currentBalance - b.currentBalance
  )

  const amortDebt = amortDebtId ? debts.find(d => d.id === amortDebtId) ?? null : null

  return (
    <div className="space-y-5">
      {/* Strategy selector */}
      <div className="card p-4">
        <p className="text-xs text-slate-400 mb-3 font-medium">🤖 Chiến lược tối ưu trả nợ</p>
        <div className="grid grid-cols-2 gap-3">
          <StrategyCard
            name="Avalanche"
            emoji="🏔️"
            description="Trả lãi suất cao nhất trước. Tiết kiệm tiền lãi nhiều nhất."
            badge="Tiết kiệm 8.2tr lãi"
            selected={strategy === 'avalanche'}
            onClick={() => setStrategy('avalanche')}
          />
          <StrategyCard
            name="Snowball"
            emoji="⛄"
            description="Trả khoản nhỏ nhất trước. Tạo động lực tâm lý tốt hơn."
            badge="Trả xong xe sau 5 năm"
            selected={strategy === 'snowball'}
            onClick={() => setStrategy('snowball')}
          />
        </div>
        <p className="text-[11px] text-emerald-400 mt-3 text-center">
          💡 Với chiến lược {strategy === 'avalanche' ? 'Avalanche' : 'Snowball'}, bạn tiết kiệm được{' '}
          <strong>{strategy === 'avalanche' ? '8.2tr' : '5.5tr'}</strong> tiền lãi so với trả tối thiểu
        </p>
      </div>

      {/* Debt overview */}
      <div className="grid grid-cols-3 gap-4">
        <DebtStatCard label="Tổng dư nợ" value={fmtShort(totalDebt)} color="#ef4444" icon="💸" />
        <DebtStatCard label="Trả hàng tháng" value={fmtShort(totalMonthly)} color="#f59e0b" icon="📅" />
        <DebtStatCard label="Dự kiến tất toán" value="2033" color="#6366f1" icon="🏁" isYear />
      </div>

      {/* Debt list */}
      <div className="space-y-3">
        {sorted.map((debt, i) => {
          const paidPercent = ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100
          const monthlyInterest = debt.currentBalance * (debt.interestRate / 12)
          const monthlyPrincipal = debt.monthlyPayment - monthlyInterest
          const monthsLeft = monthlyPrincipal > 0 ? Math.ceil(debt.currentBalance / monthlyPrincipal) : 999

          return (
            <div key={debt.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${debt.color}20`, color: debt.color, border: `1px solid ${debt.color}30` }}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{debt.name}</h3>
                    <p className="text-[11px] text-slate-500">{debt.lenderName} · {(debt.interestRate * 100).toFixed(1)}%/năm</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="blur-sensitive font-num text-sm font-bold text-white">{fmtShort(debt.currentBalance)}</p>
                  <p className="text-[10px] text-slate-500">dư nợ còn lại</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
                  <span>Đã trả: {paidPercent.toFixed(1)}%</span>
                  <span>Gốc vay: {fmtShort(debt.originalAmount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${paidPercent}%`, background: debt.color, boxShadow: `0 0 8px ${debt.color}60` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.06]">
                <MiniStat label="Trả hàng tháng" value={fmtShort(debt.monthlyPayment)} />
                <MiniStat label="Phần lãi" value={fmtShort(monthlyInterest)} color="#ef4444" />
                <MiniStat label="Phần gốc" value={fmtShort(Math.max(0, monthlyPrincipal))} color="#10b981" />
              </div>

              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  ⏱ Còn khoảng <strong className="text-slate-300">{monthsLeft} tháng</strong> nữa tất toán
                </span>
                <button
                  onClick={() => setAmortDebtId(debt.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-600/10 transition-colors"
                >
                  Xem bảng khấu hao →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-white/[0.08] text-slate-500 text-sm hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-600/5 transition-all"
      >
        + Thêm khoản nợ mới
      </button>

      {showAdd && <AddDebtModal onClose={() => setShowAdd(false)} onSave={addDebt} />}
      {amortDebt && (
        <AmortizationScheduleModal debt={amortDebt} onClose={() => setAmortDebtId(null)} />
      )}
    </div>
  )
}

// ============================================================
// AMORTIZATION SCHEDULE MODAL
// ============================================================
function AmortizationScheduleModal({ debt, onClose }: {
  debt: { id: string; name: string; currentBalance: number; interestRate: number; monthlyPayment: number }
  onClose: () => void
}) {
  const [showAll, setShowAll] = useState(false)

  const schedule = calculateAmortization({
    id: debt.id,
    name: debt.name,
    currentBalance: debt.currentBalance,
    interestRate: debt.interestRate,
    monthlyPayment: debt.monthlyPayment,
  })

  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0)
  const totalPayment = schedule.reduce((s, r) => s + r.payment, 0)
  const displayed = showAll ? schedule : schedule.slice(0, 12)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <h3 className="font-semibold text-white">Bảng khấu hao</h3>
              <p className="text-xs text-slate-500 mt-0.5">{debt.name}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/[0.06] flex-shrink-0">
            <div className="bg-[#0f1117] px-4 py-3 text-center">
              <p className="text-[10px] text-slate-500 mb-0.5">Tổng kỳ</p>
              <p className="font-num text-sm font-bold text-white">{schedule.length} tháng</p>
            </div>
            <div className="bg-[#0f1117] px-4 py-3 text-center">
              <p className="text-[10px] text-slate-500 mb-0.5">Tổng lãi phải trả</p>
              <p className="blur-sensitive font-num text-sm font-bold text-red-400">{fmtShort(totalInterest)}</p>
            </div>
            <div className="bg-[#0f1117] px-4 py-3 text-center">
              <p className="text-[10px] text-slate-500 mb-0.5">Tổng phải trả</p>
              <p className="blur-sensitive font-num text-sm font-bold text-amber-400">{fmtShort(totalPayment)}</p>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#141720] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-medium">Kỳ</th>
                  <th className="text-left px-3 py-2.5 text-slate-500 font-medium">Tháng</th>
                  <th className="text-right px-3 py-2.5 text-slate-500 font-medium">Trả góp</th>
                  <th className="text-right px-3 py-2.5 text-slate-500 font-medium text-emerald-500/70">Gốc</th>
                  <th className="text-right px-3 py-2.5 text-slate-500 font-medium text-red-500/70">Lãi</th>
                  <th className="text-right px-4 py-2.5 text-slate-500 font-medium">Dư nợ còn</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((row, idx) => (
                  <tr key={row.month} className={`border-b border-white/[0.03] ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-4 py-2.5 text-slate-400 font-mono">{row.month}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {row.date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5 text-right blur-sensitive font-num text-slate-300">{fmtShort(row.payment)}</td>
                    <td className="px-3 py-2.5 text-right blur-sensitive font-num text-emerald-400">{fmtShort(row.principal)}</td>
                    <td className="px-3 py-2.5 text-right blur-sensitive font-num text-red-400">{fmtShort(row.interest)}</td>
                    <td className="px-4 py-2.5 text-right blur-sensitive font-num text-slate-300">{fmtShort(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 p-4 border-t border-white/[0.06] flex-shrink-0">
            {schedule.length > 12 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex-1 py-2 rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors"
              >
                {showAll ? `Thu gọn (hiện 12/${schedule.length})` : `Xem thêm (${schedule.length - 12} kỳ còn lại)`}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-sm hover:bg-indigo-600/30 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ADD DEBT MODAL
// ============================================================
function AddDebtModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [debtType, setDebtType] = useState('MORTGAGE')
  const [name, setName] = useState('')
  const [lenderName, setLenderName] = useState('Vietcombank')
  const [originalAmount, setOriginalAmount] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [error, setError] = useState('')

  const debtTypes = [
    { v: 'MORTGAGE', label: '🏠 Vay mua nhà', color: '#ef4444' },
    { v: 'CAR_LOAN', label: '🚗 Vay mua xe', color: '#f59e0b' },
    { v: 'CONSUMER', label: '💳 Vay tiêu dùng', color: '#6366f1' },
    { v: 'OTHER', label: '📦 Khác', color: '#94a3b8' },
  ]

  const parseNum = (s: string) => parseInt(s.replace(/\D/g, '') || '0')
  const handleNumInput = (setter: (v: string) => void) => (val: string) => {
    const digits = val.replace(/\D/g, '')
    setter(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
  }

  const handleSave = () => {
    if (!name.trim()) { setError('Vui lòng nhập tên khoản nợ'); return }
    const orig = parseNum(originalAmount)
    const curr = parseNum(currentBalance)
    const rate = parseFloat(interestRate) || 0
    const monthly = parseNum(monthlyPayment)
    if (orig <= 0 || curr <= 0 || rate <= 0 || monthly <= 0) { setError('Vui lòng điền đầy đủ thông tin'); return }
    const colorMap: Record<string, string> = { MORTGAGE: '#ef4444', CAR_LOAN: '#f59e0b', CONSUMER: '#6366f1', OTHER: '#94a3b8' }
    onSave({
      name: name.trim(),
      type: debtType,
      lenderName,
      originalAmount: orig,
      currentBalance: curr,
      interestRate: rate / 100,
      monthlyPayment: monthly,
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
      color: colorMap[debtType] ?? '#94a3b8',
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">Thêm khoản nợ mới</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>

          <div className="px-5 pb-6 pt-4 space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Loại khoản nợ</label>
              <div className="grid grid-cols-2 gap-2">
                {debtTypes.map(t => (
                  <button key={t.v} onClick={() => setDebtType(t.v)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all text-left
                      ${debtType === t.v ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:bg-white/[0.08]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tên khoản nợ</label>
              <input type="text" placeholder="VD: Vay mua nhà Vietcombank" value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Ngân hàng / Tổ chức cho vay</label>
              <select value={lenderName} onChange={e => setLenderName(e.target.value)} className="select-field">
                {['Vietcombank', 'Techcombank', 'MBBank', 'BIDV', 'VPBank', 'ACB', 'TPBank', 'Khác'].map(b => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Số tiền gốc vay (₫)</label>
                <input type="text" placeholder="500.000.000" value={originalAmount} onChange={e => handleNumInput(setOriginalAmount)(e.target.value)} className="input-field font-num" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Dư nợ hiện tại (₫)</label>
                <input type="text" placeholder="450.000.000" value={currentBalance} onChange={e => handleNumInput(setCurrentBalance)(e.target.value)} className="input-field font-num" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Lãi suất (%/năm)</label>
                <input type="number" placeholder="8.5" step="0.1" min="0" max="100" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="input-field font-num" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Trả hàng tháng (₫)</label>
                <input type="text" placeholder="15.800.000" value={monthlyPayment} onChange={e => handleNumInput(setMonthlyPayment)(e.target.value)} className="input-field font-num" />
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm">
              Thêm khoản nợ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// INVESTMENT TAB
// ============================================================
function InvestmentTab() {
  const investments = useAppStore(s => s.investments)
  const addInvestment = useAppStore(s => s.addInvestment)
  const [showAddInv, setShowAddInv] = useState(false)

  const totalCost = investments.reduce((s, i) => s + i.amount, 0)
  const totalValue = investments.reduce((s, i) => s + i.current, 0)
  const totalPnL = totalValue - totalCost

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <DebtStatCard label="Tổng đầu tư" value={fmtShort(totalCost)} color="#6366f1" icon="💰" />
        <DebtStatCard label="Giá trị hiện tại" value={fmtShort(totalValue)} color="#10b981" icon="📈" />
        <DebtStatCard label="Lãi/Lỗ" value={`${totalPnL >= 0 ? '+' : ''}${fmtShort(totalPnL)}`} color={totalPnL >= 0 ? '#10b981' : '#ef4444'} icon="✨" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-300">Danh mục đầu tư</p>
          <button
            onClick={() => setShowAddInv(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-600/10 transition-colors"
          >
            + Thêm
          </button>
        </div>
        <div className="space-y-4">
          {investments.map(inv => {
            const pnl = inv.current - inv.amount
            const pnlPercent = inv.amount > 0 ? (pnl / inv.amount) * 100 : 0
            return (
              <div key={inv.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${inv.color}15` }}>
                  {inv.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{inv.name}</p>
                  <p className="text-[11px] text-slate-500">{getInvType(inv.type)} · {(inv.rate * 100).toFixed(1)}%/năm</p>
                </div>
                <div className="text-right">
                  <p className="blur-sensitive font-num text-sm font-bold text-white">{fmtShort(inv.current)}</p>
                  <p className={`font-num text-[11px] font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}{fmtShort(pnl)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAddInv && <AddInvestmentModal onClose={() => setShowAddInv(false)} onSave={addInvestment} />}
    </div>
  )
}

function getInvType(t: string) {
  const m: Record<string, string> = { SAVINGS_TERM: 'Tiết kiệm có kỳ hạn', STOCK: 'Cổ phiếu', FUND: 'Quỹ mở', GOLD: 'Vàng', CRYPTO: 'Crypto' }
  return m[t] ?? t
}

// ============================================================
// ADD INVESTMENT MODAL
// ============================================================
function AddInvestmentModal({ onClose, onSave }: { onClose: () => void; onSave: (inv: any) => void }) {
  const [invType, setInvType] = useState('SAVINGS_TERM')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [current, setCurrent] = useState('')
  const [rate, setRate] = useState('')
  const [error, setError] = useState('')

  const invTypes = [
    { v: 'SAVINGS_TERM', label: '🐷 Tiết kiệm', icon: '🐷', color: '#84cc16' },
    { v: 'STOCK', label: '📊 Cổ phiếu', icon: '📊', color: '#10b981' },
    { v: 'FUND', label: '📈 Quỹ mở', icon: '📈', color: '#6366f1' },
    { v: 'GOLD', label: '🥇 Vàng', icon: '🥇', color: '#f59e0b' },
    { v: 'CRYPTO', label: '🪙 Crypto', icon: '🪙', color: '#8b5cf6' },
  ]

  const handleNumInput = (setter: (v: string) => void) => (val: string) => {
    const digits = val.replace(/\D/g, '')
    setter(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
  }

  const handleSave = () => {
    if (!name.trim()) { setError('Vui lòng nhập tên'); return }
    const numAmount = parseInt(amount.replace(/\D/g, '') || '0')
    const numCurrent = parseInt(current.replace(/\D/g, '') || '0')
    if (numAmount <= 0) { setError('Vui lòng nhập số tiền đầu tư'); return }
    const typeData = invTypes.find(t => t.v === invType)!
    onSave({
      name: name.trim(),
      type: invType,
      amount: numAmount,
      current: numCurrent || numAmount,
      rate: parseFloat(rate) / 100 || 0,
      icon: typeData.icon,
      color: typeData.color,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">Thêm khoản đầu tư</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>

          <div className="px-5 pb-6 pt-4 space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Loại đầu tư</label>
              <div className="flex flex-wrap gap-2">
                {invTypes.map(t => (
                  <button key={t.v} onClick={() => setInvType(t.v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                      ${invType === t.v ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:bg-white/[0.08]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tên danh mục đầu tư</label>
              <input type="text" placeholder="VD: Tiết kiệm ACB 12 tháng" value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Số tiền đầu tư (₫)</label>
                <input type="text" placeholder="50.000.000" value={amount} onChange={e => handleNumInput(setAmount)(e.target.value)} className="input-field font-num" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Giá trị hiện tại (₫)</label>
                <input type="text" placeholder="52.000.000" value={current} onChange={e => handleNumInput(setCurrent)(e.target.value)} className="input-field font-num" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Lợi suất kỳ vọng (%/năm)</label>
              <input type="number" placeholder="6.5" step="0.1" min="0" value={rate} onChange={e => setRate(e.target.value)} className="input-field font-num" />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm">
              Thêm đầu tư
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// GOALS TAB
// ============================================================
function GoalsTab() {
  const goals = useAppStore(s => s.goals)
  const addGoal = useAppStore(s => s.addGoal)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(goal => {
          const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0
          const remaining = goal.target - goal.current
          const daysLeft = Math.floor((new Date(goal.date).getTime() - Date.now()) / 86400000)

          return (
            <div key={goal.id} className="card p-5 group hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{goal.name}</p>
                    <p className="text-[10px] text-slate-600">
                      {daysLeft > 0 ? `Còn ${Math.floor(daysLeft / 365)} năm ${Math.floor((daysLeft % 365) / 30)} tháng` : 'Đã đến hạn!'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="blur-sensitive font-num text-slate-300 font-medium">{fmtShort(goal.current)}</span>
                  <span className="text-slate-500">/ {fmtShort(goal.target)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(pct, 100)}%`, background: goal.color, boxShadow: `0 0 8px ${goal.color}50` }}
                  />
                </div>
                <p className="text-right text-[10px] text-slate-600 mt-1">{pct.toFixed(1)}% đạt được</p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Còn cần: <span className="blur-sensitive text-slate-300 font-semibold">{fmtShort(remaining)}</span>
                </span>
                <button
                  onClick={() => setContributeGoal(goal)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-600/10 transition-colors"
                >
                  + Đóng góp
                </button>
              </div>
            </div>
          )
        })}

        <div
          onClick={() => setShowAddGoal(true)}
          className="rounded-2xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-all p-8"
        >
          <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-500 text-2xl">+</div>
          <span className="text-xs text-slate-600">Thêm mục tiêu mới</span>
        </div>
      </div>

      {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} onSave={addGoal} />}
      {contributeGoal && <ContributeModal goal={contributeGoal} onClose={() => setContributeGoal(null)} />}
    </div>
  )
}

// ============================================================
// ADD GOAL MODAL
// ============================================================
function AddGoalModal({ onClose, onSave }: { onClose: () => void; onSave: (g: any) => void }) {
  const ICONS = ['✈️', '🚗', '🏠', '🎓', '💍', '🐷', '🎮', '🏖️', '💪', '🎯']
  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#ef4444', '#84cc16', '#06b6d4', '#8b5cf6']
  const [selectedIcon, setSelectedIcon] = useState('🎯')
  const [selectedColor, setSelectedColor] = useState('#6366f1')
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [initial, setInitial] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  const handleNumInput = (setter: (v: string) => void) => (val: string) => {
    const digits = val.replace(/\D/g, '')
    setter(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
  }

  const handleSave = () => {
    if (!name.trim()) { setError('Vui lòng nhập tên mục tiêu'); return }
    const numTarget = parseInt(target.replace(/\D/g, '') || '0')
    if (numTarget <= 0) { setError('Vui lòng nhập số tiền mục tiêu'); return }
    if (!date) { setError('Vui lòng chọn ngày hoàn thành'); return }
    onSave({
      name: name.trim(),
      icon: selectedIcon,
      target: numTarget,
      current: parseInt(initial.replace(/\D/g, '') || '0'),
      date,
      color: selectedColor,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">Thêm mục tiêu tài chính</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>

          <div className="px-5 pb-6 pt-4 space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Biểu tượng</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all
                      ${selectedIcon === icon ? 'bg-indigo-600/25 border-2 border-indigo-500/60' : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-2 block">Màu sắc</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${selectedColor === c ? 'ring-2 ring-white/40 scale-110' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tên mục tiêu</label>
              <input type="text" placeholder="VD: Du lịch Nhật Bản 2027" value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Mục tiêu (₫)</label>
                <input type="text" placeholder="80.000.000" value={target} onChange={e => handleNumInput(setTarget)(e.target.value)} className="input-field font-num" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Đã có sẵn (₫)</label>
                <input type="text" placeholder="0" value={initial} onChange={e => handleNumInput(setInitial)(e.target.value)} className="input-field font-num" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Hạn hoàn thành</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" min={new Date().toISOString().split('T')[0]} />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm">
              Tạo mục tiêu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CONTRIBUTE MODAL
// ============================================================
function ContributeModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const accounts = useAppStore(s => s.accounts)
  const contributeToGoal = useAppStore(s => s.contributeToGoal)
  const [amount, setAmount] = useState('')
  const [fromAccountId, setFromAccountId] = useState(() =>
    accounts.find(a => ['BANK_ACCOUNT', 'CASH', 'E_WALLET'].includes(a.type))?.id ?? ''
  )
  const [error, setError] = useState('')

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) { setAmount(''); return }
    setAmount(parseInt(digits).toLocaleString('vi-VN'))
  }

  const remaining = goal.target - goal.current

  const handleSave = () => {
    const numAmount = parseInt(amount.replace(/\D/g, '') || '0')
    if (numAmount <= 0) { setError('Vui lòng nhập số tiền hợp lệ'); return }
    const account = accounts.find(a => a.id === fromAccountId)
    if (account && account.balance < numAmount) { setError('Số dư tài khoản không đủ'); return }
    contributeToGoal(goal.id, numAmount, fromAccountId || undefined)
    onClose()
  }

  const liquidAccounts = accounts.filter(a => ['BANK_ACCOUNT', 'CASH', 'E_WALLET'].includes(a.type))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="font-semibold text-white">Đóng góp mục tiêu</h3>
              <p className="text-xs text-slate-500 mt-0.5">{goal.icon} {goal.name}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>

          <div className="px-5 pb-6 pt-4 space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Đã đạt: <span className="blur-sensitive text-slate-300 font-semibold">{fmtShort(goal.current)}</span></span>
                <span>Mục tiêu: <span className="text-slate-300 font-semibold">{fmtShort(goal.target)}</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%`, background: goal.color }} />
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">Còn cần: <span className="blur-sensitive text-slate-400">{fmtShort(remaining)}</span></p>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Số tiền đóng góp (₫)</label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric" placeholder="0" value={amount}
                  onChange={e => handleAmountChange(e.target.value)}
                  className="input-field font-num text-2xl font-bold text-center pr-10" autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">₫</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[500_000, 1_000_000, 2_000_000, 5_000_000].map(q => (
                  <button key={q} onClick={() => setAmount(q.toLocaleString('vi-VN'))}
                    className="flex-1 py-1.5 rounded-lg text-[11px] text-indigo-400 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-colors">
                    {fmtShort(q)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Từ tài khoản</label>
              <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="select-field">
                {liquidAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name} — {fmtShort(a.balance)}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm">
              Xác nhận đóng góp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- SHARED COMPONENTS ----
function StrategyCard({ name, emoji, description, badge, selected, onClick }: {
  name: string; emoji: string; description: string; badge: string; selected: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all
        ${selected ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06]'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{emoji}</span>
        <span className="font-semibold text-sm">{name}</span>
        {selected && <span className="ml-auto text-[10px] text-indigo-400">✓ Đang dùng</span>}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">📊 {badge}</span>
    </button>
  )
}

function DebtStatCard({ label, value, color, icon, isYear }: { label: string; value: string; color: string; icon: string; isYear?: boolean }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <p className={`font-num text-xl font-bold ${isYear ? '' : 'blur-sensitive'}`} style={{ color }}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-600 mb-0.5">{label}</p>
      <p className="blur-sensitive font-num text-sm font-semibold" style={{ color: color ?? '#94a3b8' }}>{value}</p>
    </div>
  )
}

function fmtShort(n: number) {
  const a = Math.abs(n)
  if (a >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (a >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('vi-VN')
}
