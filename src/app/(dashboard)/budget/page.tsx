'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { GravityProgressBar } from '@/components/bento/GravityProgressBar'
import { useAppStore, BUDGET_CATEGORIES } from '@/lib/store'
import { type Budget } from '@/lib/mock-data'
import { useIsApiMode } from '@/hooks/use-data-source'
import { useBudgets as useApiBudgets } from '@/hooks/queries/use-budgets'
import { useSummary as useApiSummary } from '@/hooks/queries/use-summary'

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

export default function BudgetPage() {
  const isApi = useIsApiMode()

  const apiBudgets = useApiBudgets()
  const apiSummary = useApiSummary()

  const storeBudgets = useAppStore(s => s.budgets)
  const storeSummary = useAppStore(s => s.getSummary())

  const budgets = isApi && apiBudgets.data ? apiBudgets.data as any[] : storeBudgets
  const summary = isApi && apiSummary.data ? apiSummary.data as any : storeSummary

  const [activeMonth, setActiveMonth] = useState(2) // March (0-indexed)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)

  const totalBudgeted = budgets.reduce((s, b) => s + b.budgeted, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overallPercent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  const overBudget = budgets.filter(b => b.spent > b.budgeted)
  const onTrack = budgets.filter(b => b.spent <= b.budgeted)

  return (
    <div className="animate-fade-in">
      <Topbar title="Ngân sách" subtitle="Kiểm soát chi tiêu theo Zero-based Budgeting" />

      {/* Month selector */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => setActiveMonth(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${i === activeMonth
                ? 'bg-indigo-600 text-white'
                : 'bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:bg-white/[0.08]'
              }`}
          >
            {m}/2026
          </button>
        ))}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Big gauge */}
        <div className="card p-5 md:col-span-1">
          <p className="text-sm text-slate-400 font-medium mb-4">Tổng quan tháng {MONTHS[activeMonth]}</p>

          {/* Circular gauge */}
          <div className="relative flex items-center justify-center my-4">
            <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={80} cy={80} r={65} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
              <circle
                cx={80} cy={80} r={65}
                fill="none"
                stroke={overallPercent > 100 ? '#ef4444' : overallPercent > 80 ? '#f59e0b' : '#10b981'}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${Math.min(overallPercent, 100) / 100 * (2 * Math.PI * 65)} ${2 * Math.PI * 65}`}
                style={{ transition: 'stroke-dasharray 1s ease-out', filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-num text-3xl font-bold text-white">{overallPercent.toFixed(0)}%</span>
              <span className="text-xs text-slate-500 mt-0.5">đã sử dụng</span>
            </div>
          </div>

          <div className="space-y-2">
            <BudgetStat label="Tổng ngân sách" value={totalBudgeted} color="#94a3b8" />
            <BudgetStat label="Đã chi" value={totalSpent} color="#ef4444" />
            <BudgetStat label="Còn lại" value={totalRemaining} color="#10b981" highlight />
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="font-num text-lg font-bold text-emerald-400">{onTrack.length}</p>
              <p className="text-[10px] text-slate-500">Đang tốt</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="font-num text-lg font-bold text-red-400">{overBudget.length}</p>
              <p className="text-[10px] text-slate-500">Vượt ngân sách</p>
            </div>
          </div>
        </div>

        {/* Budget bars column */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-slate-300 font-semibold">Chi tiết từng danh mục</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600/30 transition-colors"
            >
              <span>+</span> Thêm ngân sách
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-sm text-slate-500">Chưa có ngân sách nào. Thêm ngân sách để bắt đầu!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {budgets.map(b => (
                <div key={b.id} className="relative group">
                  <GravityProgressBar budget={b} />
                  <button
                    onClick={() => setEditBudget(b)}
                    className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity
                      text-[10px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded-lg bg-indigo-600/15"
                  >
                    Sửa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zero-based allocation helper */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎯</span>
          <h3 className="text-sm font-semibold text-slate-300">Zero-based Budgeting</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
            Tháng {MONTHS[activeMonth]}/2026
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Phân bổ thu nhập cho từng danh mục sao cho <strong className="text-slate-300">Thu nhập − Tổng ngân sách = 0</strong>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AllocationCard label="Thu nhập tháng" value={summary.monthlyIncome} color="#10b981" icon="💰" />
          <AllocationCard label="Đã phân bổ" value={totalBudgeted} color="#6366f1" icon="📊" />
          <AllocationCard
            label="Chưa phân bổ"
            value={summary.monthlyIncome - totalBudgeted}
            color={(summary.monthlyIncome - totalBudgeted) < 0 ? '#ef4444' : '#f59e0b'}
            icon={(summary.monthlyIncome - totalBudgeted) < 0 ? '⚠️' : '📦'}
          />
          <AllocationCard label="Tiết kiệm kế hoạch" value={10_000_000} color="#84cc16" icon="🐷" />
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>0</span>
            <span className="text-slate-400 font-medium">
              {summary.monthlyIncome > 0
                ? ((totalBudgeted / summary.monthlyIncome) * 100).toFixed(0)
                : 0}% thu nhập đã phân bổ
            </span>
            <span>{fmtShort(summary.monthlyIncome)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-1000"
              style={{ width: `${summary.monthlyIncome > 0 ? Math.min((totalBudgeted / summary.monthlyIncome) * 100, 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <AddBudgetModal onClose={() => setShowAddModal(false)} />}
      {editBudget && <EditBudgetModal budget={editBudget} onClose={() => setEditBudget(null)} />}
    </div>
  )
}

// ---- SUB-COMPONENTS ----

function BudgetStat({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`blur-sensitive font-num text-sm font-semibold ${highlight ? 'text-emerald-400' : ''}`}
        style={{ color: highlight ? undefined : color }}>
        {fmtVND(value)}
      </span>
    </div>
  )
}

function AllocationCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: `${color}0f`, border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] text-slate-400">{label}</span>
      </div>
      <p className="blur-sensitive font-num text-lg font-bold" style={{ color }}>
        {fmtShort(value)}
      </p>
    </div>
  )
}

function AddBudgetModal({ onClose }: { onClose: () => void }) {
  const addBudget = useAppStore(s => s.addBudget)
  const deleteBudget = useAppStore(s => s.deleteBudget)
  const budgets = useAppStore(s => s.budgets)

  // Exclude already added categories
  const existingCatIds = new Set(budgets.map(b => b.categoryId))
  const availableCats = BUDGET_CATEGORIES.filter(c => !existingCatIds.has(c.id))

  const [selectedCatId, setSelectedCatId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  // Sync selected to first available (handles async Zustand rehydration)
  useEffect(() => {
    if (availableCats.length > 0 && !availableCats.find(c => c.id === selectedCatId)) {
      setSelectedCatId(availableCats[0].id)
    }
  }, [availableCats.map(c => c.id).join(',')])

  const handleSave = () => {
    const numAmount = parseInt(amount.replace(/\D/g, '') || '0')
    if (numAmount <= 0) { setError('Vui lòng nhập hạn mức hợp lệ'); return }
    // Use selectedCatId if it's in availableCats, else fall back to first available
    const effectiveCatId = availableCats.find(c => c.id === selectedCatId)?.id ?? availableCats[0]?.id
const cat = BUDGET_CATEGORIES.find(c => c.id === effectiveCatId)
    if (!cat) { setError('Vui lòng chọn danh mục'); return }
    addBudget({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      color: cat.color,
      budgeted: numAmount,
      spent: 0,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">Thêm ngân sách mới</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
          </div>
          <div className="p-5 space-y-4">
            {availableCats.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">Tất cả danh mục đã được thêm ngân sách.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Danh mục</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableCats.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCatId(c.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left
                          ${selectedCatId === c.id
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:bg-white/[0.08]'
                          }`}
                      >
                        <span className="text-lg">{c.icon}</span>
                        <span className="text-[11px] leading-tight">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Hạn mức ngân sách (₫)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="VD: 3.000.000"
                    value={amount}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '')
                      setAmount(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
                    }}
                    className="input-field font-num text-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[2_000_000, 3_000_000, 5_000_000, 8_000_000, 10_000_000, 15_000_000].map(v => (
                    <button
                      key={v}
                      onClick={() => setAmount(v.toLocaleString('vi-VN'))}
                      className="py-2 rounded-lg text-xs font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                    >
                      {fmtShort(v)}
                    </button>
                  ))}
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button onClick={handleSave} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
                  Lưu ngân sách
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EditBudgetModal({ budget, onClose }: { budget: Budget; onClose: () => void }) {
  const updateBudget = useAppStore(s => s.updateBudget)
  const deleteBudget = useAppStore(s => s.deleteBudget)
  const [amount, setAmount] = useState(budget.budgeted.toLocaleString('vi-VN'))
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = () => {
    const numAmount = parseInt(amount.replace(/\D/g, '') || '0')
    if (numAmount > 0) {
      updateBudget(budget.id, { budgeted: numAmount })
    }
    onClose()
  }

  const handleDelete = () => {
    deleteBudget(budget.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">
              {budget.categoryIcon} Sửa ngân sách — {budget.categoryName}
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Đã chi tháng này</span>
                <span className="blur-sensitive font-num text-red-400 font-semibold">{fmtVND(budget.spent)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${Math.min((budget.spent / budget.budgeted) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Hạn mức mới (₫)</label>
              <input
                type="text"
                value={amount}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  setAmount(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
                }}
                className="input-field font-num text-xl font-bold text-center"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[2_000_000, 3_000_000, 5_000_000, 8_000_000, 10_000_000, 15_000_000].map(v => (
                <button key={v} onClick={() => setAmount(v.toLocaleString('vi-VN'))}
                  className="py-2 rounded-lg text-xs font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
                  {fmtShort(v)}
                </button>
              ))}
            </div>

            {!showDeleteConfirm ? (
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
                  Cập nhật
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-colors"
                >
                  🗑️
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400 mb-3">⚠️ Xóa ngân sách {budget.categoryName}? Dữ liệu chi tiêu sẽ không bị xóa.</p>
                <div className="flex gap-2">
                  <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-xs hover:bg-red-600/30 transition-colors">
                    Xác nhận xóa
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-lg bg-white/[0.04] text-slate-400 border border-white/[0.06] text-xs hover:bg-white/[0.08] transition-colors">
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- UTILS ----
function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}
function fmtShort(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('vi-VN')
}
