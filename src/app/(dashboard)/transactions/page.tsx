'use client'

import { useState, useMemo } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAppStore, ALL_CATEGORIES } from '@/lib/store'
import { type Transaction } from '@/lib/mock-data'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { Portal } from '@/components/Portal'

const TX_TYPES = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'INCOME', label: '↑ Thu nhập' },
  { value: 'EXPENSE', label: '↓ Chi tiêu' },
  { value: 'TRANSFER', label: '↔ Chuyển khoản' },
]

export default function TransactionsPage() {
  const transactions = useAppStore(s => s.transactions)
  const accounts = useAppStore(s => s.accounts)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false
      if (accountFilter !== 'ALL' && tx.accountId !== accountFilter) return false
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase()) &&
          !tx.categoryName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [transactions, search, typeFilter, accountFilter])

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    filtered.forEach(tx => {
      const key = new Date(tx.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(tx)
    })
    return groups
  }, [filtered])

  // Stats
  const totalIncome = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="animate-fade-in">
      <Topbar title="Sổ quỹ" subtitle="Lịch sử giao dịch toàn bộ tài khoản" onAdd={() => setShowModal(true)} />

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Tổng thu nhập" value={totalIncome} color="#10b981" prefix="+" />
        <SummaryCard label="Tổng chi tiêu" value={totalExpense} color="#ef4444" prefix="-" />
        <SummaryCard label="Thặng dư" value={totalIncome - totalExpense} color="#6366f1" prefix={totalIncome >= totalExpense ? '+' : '-'} />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Tìm kiếm giao dịch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5">
          {TX_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${typeFilter === t.value
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:bg-white/[0.08]'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Account filter */}
        <select
          value={accountFilter}
          onChange={e => setAccountFilter(e.target.value)}
          className="select-field w-auto min-w-36"
        >
          <option value="ALL">Tất cả tài khoản</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Add button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <span>+</span> Thêm giao dịch
        </button>
      </div>

      {/* Transaction Groups */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([dateLabel, txs]) => {
          const dayIncome = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
          const dayExpense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

          return (
            <div key={dateLabel}>
              {/* Date header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-medium text-slate-500 capitalize">{dateLabel}</p>
                <div className="flex gap-3 text-xs font-mono">
                  {dayIncome > 0 && <span className="text-emerald-500">+{fmtShort(dayIncome)}</span>}
                  {dayExpense > 0 && <span className="text-red-400">-{fmtShort(dayExpense)}</span>}
                </div>
              </div>

              {/* Transactions */}
              <div className="card overflow-hidden">
                {txs.map((tx, i) => (
                  <TransactionRow key={tx.id} tx={tx} isLast={i === txs.length - 1} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm">Không tìm thấy giao dịch nào</p>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ---- ROW ----
function TransactionRow({ tx, isLast }: { tx: Transaction; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const deleteTransaction = useAppStore(s => s.deleteTransaction)

  const color = tx.type === 'INCOME' ? '#10b981' : tx.type === 'TRANSFER' ? '#6366f1' : '#ef4444'
  const prefix = tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '↔' : '-'
  const cls = tx.type === 'INCOME' ? 'text-income' : tx.type === 'TRANSFER' ? 'text-transfer' : 'text-expense'

  const handleDelete = () => {
    deleteTransaction(tx.id)
    setExpanded(false)
  }

  return (
    <div className={`${!isLast ? 'border-b border-white/[0.04]' : ''}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `${color}15` }}
        >
          {tx.categoryIcon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">{tx.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-600">{tx.categoryName}</span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-600">{tx.accountName}</span>
            {tx.tags?.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 rounded-full bg-indigo-600/15 text-indigo-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className={`blur-sensitive font-num text-sm font-semibold ${cls}`}>
            {prefix}{fmtVND(tx.amount)}
          </p>
          <TypeBadge type={tx.type} />
        </div>

        {/* Expand arrow */}
        <span className={`text-slate-600 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-white/[0.02] border-t border-white/[0.04]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
            <DetailRow label="Ngày giờ" value={new Date(tx.date).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })} />
            <DetailRow label="Tài khoản" value={tx.accountName} />
            <DetailRow label="Danh mục" value={`${tx.categoryIcon} ${tx.categoryName}`} />
            <DetailRow label="Loại" value={tx.type === 'INCOME' ? 'Thu nhập' : tx.type === 'TRANSFER' ? 'Chuyển khoản' : 'Chi tiêu'} />
            <DetailRow label="Số tiền" value={`${prefix}${fmtVND(tx.amount)}`} valueClass={cls} sensitive />
            {tx.tags && tx.tags.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-600 mb-0.5">Tags</p>
                <div className="flex gap-1 flex-wrap">
                  {tx.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600/15 text-indigo-400">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!showDeleteConfirm ? (
            <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] text-xs transition-colors border border-white/[0.06]"
              >
                ✏️ Sửa
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors border border-red-500/20"
              >
                🗑️ Xóa
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/[0.04]">
              <p className="text-xs text-red-400 mb-2">⚠️ Xác nhận xóa giao dịch này? Số dư tài khoản sẽ được hoàn lại.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-xs hover:bg-red-600/30 transition-colors"
                >
                  Xác nhận xóa
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 border border-white/[0.06] text-xs hover:bg-white/[0.08] transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal — Portal escapes parent .card overflow-hidden & backdrop-filter */}
      {editing && (
        <Portal>
          <EditTransactionModal tx={tx} onClose={() => setEditing(false)} />
        </Portal>
      )}
    </div>
  )
}

// ---- EDIT TRANSACTION MODAL ----
function EditTransactionModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const updateTransaction = useAppStore(s => s.updateTransaction)
  const [amount, setAmount] = useState(tx.amount.toLocaleString('vi-VN'))
  const [desc, setDesc] = useState(tx.description)
  const [selectedCat, setSelectedCat] = useState(tx.categoryName)
  const [error, setError] = useState('')

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) { setAmount(''); return }
    setAmount(parseInt(digits).toLocaleString('vi-VN'))
  }

  const handleSave = () => {
    const numAmount = parseInt(amount.replace(/\D/g, '') || '0')
    if (numAmount <= 0) { setError('Vui lòng nhập số tiền hợp lệ'); return }
    const cat = ALL_CATEGORIES.find(c => c.name === selectedCat)
    updateTransaction(tx.id, {
      amount: numAmount,
      description: desc.trim() || selectedCat,
      categoryName: selectedCat,
      categoryIcon: cat?.icon ?? tx.categoryIcon,
    })
    onClose()
  }

  const displayCats = tx.type === 'INCOME'
    ? ALL_CATEGORIES.filter(c => ['Lương', 'Thu nhập phụ', 'Khác'].includes(c.name))
    : ALL_CATEGORIES.filter(c => !['Lương', 'Thu nhập phụ'].includes(c.name))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="font-semibold text-white">Sửa giao dịch</h3>
              <p className="text-xs text-slate-500 mt-0.5">{tx.categoryIcon} {tx.description}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Số tiền (₫)</label>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                className="input-field font-num text-xl font-bold text-center"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Mô tả</label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Danh mục</label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {displayCats.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCat(c.name)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                      ${selectedCat === c.name
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08] text-slate-400'
                      }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-[9px] text-center leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
              >
                Lưu thay đổi
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'INCOME') return <span className="badge-income text-[10px] px-1.5 py-0.5 rounded-full">Thu nhập</span>
  if (type === 'TRANSFER') return <span className="badge-transfer text-[10px] px-1.5 py-0.5 rounded-full">Chuyển</span>
  return <span className="badge-expense text-[10px] px-1.5 py-0.5 rounded-full">Chi tiêu</span>
}

function DetailRow({ label, value, valueClass, sensitive }: { label: string; value: string; valueClass?: string; sensitive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-slate-600 mb-0.5">{label}</p>
      <p className={`text-[11px] font-medium ${sensitive ? 'blur-sensitive' : ''} ${valueClass ?? 'text-slate-300'}`}>{value}</p>
    </div>
  )
}

// ---- UTILS ----
function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n)
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('vi-VN')
}

function SummaryCard({ label, value, color, prefix }: { label: string; value: number; color: string; prefix: string }) {
  const display = value === 0 ? '0' : `${prefix}${fmtShort(Math.abs(value))}`
  return (
    <div className="card p-4" style={{ borderColor: `${color}20` }}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="blur-sensitive font-num text-xl font-bold mt-1" style={{ color }}>
        {display}
      </p>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width={14} height={14} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}
