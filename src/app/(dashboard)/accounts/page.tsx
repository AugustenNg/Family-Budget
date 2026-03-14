'use client'

import { useState, useRef } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { FlipCard } from '@/components/bento/FlipCard'
import { useAppStore } from '@/lib/store'
import { type Account } from '@/lib/mock-data'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { useIsApiMode } from '@/hooks/use-data-source'
import { useAccounts as useApiAccounts } from '@/hooks/queries/use-accounts'
import { useTransactions as useApiTransactions } from '@/hooks/queries/use-transactions'

export default function AccountsPage() {
  const isApi = useIsApiMode()
  const apiAccounts = useApiAccounts()
  const storeAccounts = useAppStore(s => s.accounts)
  const accounts = isApi && apiAccounts.data ? apiAccounts.data as any[] : storeAccounts
  const [showAdd, setShowAdd] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  const cashAccounts = accounts.filter(a => ['BANK_ACCOUNT', 'CASH', 'E_WALLET'].includes(a.type))
  const creditAccounts = accounts.filter(a => a.type === 'CREDIT_CARD')
  const savingsAccounts = accounts.filter(a => ['SAVINGS', 'INVESTMENT'].includes(a.type))

  const totalLiquid = cashAccounts.reduce((s, a) => s + Math.max(0, a.balance), 0)
  const totalCredit = creditAccounts.reduce((s, a) => s + Math.abs(Math.min(0, a.balance)), 0)
  const totalSavings = savingsAccounts.reduce((s, a) => s + a.balance, 0)
  const netLiquid = totalLiquid - totalCredit

  return (
    <div className="animate-fade-in">
      <Topbar title="Tài khoản" subtitle="Quản lý toàn bộ tài khoản và ví tiền" />

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <NetCard label="Tiền mặt + Ngân hàng" value={totalLiquid} color="#10b981" icon="🏦" />
        <NetCard label="Dư nợ thẻ tín dụng" value={totalCredit} color="#ef4444" icon="💳" negative />
        <NetCard label="Tiết kiệm & Đầu tư" value={totalSavings} color="#84cc16" icon="🐷" />
        <NetCard label="Thanh khoản ròng" value={netLiquid} color="#6366f1" icon="💰" />
      </div>

      {/* Cash & Bank Accounts */}
      <AccountSection
        title="Tài khoản ngân hàng & Ví"
        icon="🏦"
        accounts={cashAccounts}
        onAddClick={() => setShowAdd(true)}
        onAccountClick={a => setSelectedAccountId(a.id)}
      />

      {/* Credit Cards */}
      <AccountSection
        title="Thẻ tín dụng"
        icon="💳"
        accounts={creditAccounts}
        onAddClick={() => setShowAdd(true)}
        onAccountClick={a => setSelectedAccountId(a.id)}
        warning="Chú ý: Dư nợ thẻ tín dụng là TIÊU SẢN. Luôn thanh toán đúng hạn để tránh lãi."
      />

      {/* Savings */}
      <AccountSection
        title="Tiết kiệm & Đầu tư"
        icon="📈"
        accounts={savingsAccounts}
        onAddClick={() => setShowAdd(true)}
        onAccountClick={a => setSelectedAccountId(a.id)}
      />

      {/* Account Detail Modal */}
      {selectedAccountId && (
        <AccountDetailModal accountId={selectedAccountId} onClose={() => setSelectedAccountId(null)} />
      )}

      {/* Add Account Modal */}
      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function AccountSection({
  title, icon, accounts, onAddClick, onAccountClick, warning
}: {
  title: string
  icon: string
  accounts: Account[]
  onAddClick: () => void
  onAccountClick: (a: Account) => void
  warning?: string
}) {
  const transactions = useAppStore(s => s.transactions)
  if (accounts.length === 0 && !warning) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
          <span className="text-xs text-slate-600 font-mono">({accounts.length})</span>
        </div>
        <button
          onClick={onAddClick}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-600/10"
        >
          + Thêm
        </button>
      </div>

      {warning && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <span className="text-base">⚠️</span>
          <p className="text-xs text-amber-400/80">{warning}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id}>
            <FlipCard account={acc} />
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-600">
                {transactions.filter(t => t.accountId === acc.id).length} giao dịch
              </span>
              <span
                onClick={() => onAccountClick(acc)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
              >
                Xem chi tiết →
              </span>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <div
          onClick={onAddClick}
          className="rounded-2xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2
            cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-all"
          style={{ height: 160 }}
        >
          <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-500 text-xl">
            +
          </div>
          <span className="text-xs text-slate-600">Thêm tài khoản</span>
        </div>
      </div>
    </div>
  )
}

function NetCard({ label, value, color, icon, negative }: {
  label: string; value: number; color: string; icon: string; negative?: boolean
}) {
  return (
    <div className="card p-4" style={{ borderColor: `${color}15` }}>
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <p className="blur-sensitive font-num text-lg font-bold" style={{ color }}>
        {negative ? '-' : ''}{fmtShort(value)}
      </p>
    </div>
  )
}

// ---- DETAIL MODAL ----
function AccountDetailModal({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const account = useAppStore(s => s.accounts.find(a => a.id === accountId))
  const transactions = useAppStore(s => s.transactions)
  const updateAccount = useAppStore(s => s.updateAccount)

  const [editing, setEditing] = useState(false)
  const [showAddTx, setShowAddTx] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [editBankName, setEditBankName] = useState('')

  if (!account) return null

  const txs = transactions.filter(t => t.accountId === account.id).slice(0, 8)
  const totalIn = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalOut = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  const handleStartEdit = () => {
    setEditName(account.name)
    setEditBalance(Math.abs(account.balance).toLocaleString('vi-VN'))
    setEditBankName(account.bankName ?? '')
    setEditing(true)
  }

  const handleSaveEdit = () => {
    const numBalance = parseInt(editBalance.replace(/\D/g, '') || '0')
    updateAccount(account.id, {
      name: editName.trim() || account.name,
      balance: account.type === 'CREDIT_CARD' ? -numBalance : numBalance,
      bankName: editBankName.trim() || account.bankName,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
              <h3 className="font-semibold text-white">Chỉnh sửa tài khoản</h3>
              <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Tên tài khoản</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">
                  {account.type === 'CREDIT_CARD' ? 'Dư nợ hiện tại (₫)' : 'Số dư hiện tại (₫)'}
                </label>
                <input
                  type="text"
                  value={editBalance}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '')
                    setEditBalance(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
                  }}
                  className="input-field font-num"
                />
              </div>
              {account.bankName !== undefined && (
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Ngân hàng</label>
                  <input
                    type="text"
                    value={editBankName}
                    onChange={e => setEditBankName(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => setEditing(false)}
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-2xl overflow-hidden">
          {/* Header card */}
          <div className={`bg-gradient-to-br ${account.gradient} p-6`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-xs">{account.bankName ?? getTypeLabel(account.type)}</p>
                <h2 className="text-white text-lg font-bold mt-0.5">{account.name}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleStartEdit}
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs hover:bg-white/30 transition-colors"
                >
                  Sửa
                </button>
                <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
                  ×
                </button>
              </div>
            </div>

            <p className="blur-sensitive font-num text-3xl font-bold text-white mt-4">
              {account.balance < 0 ? '-' : ''}{fmtVND(Math.abs(account.balance))}
            </p>
            {account.accountNumber && (
              <p className="text-white/40 text-xs font-mono mt-2">**** **** **** {account.accountNumber}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
            <StatCol label="Thu nhập" value={totalIn} color="#10b981" />
            <StatCol label="Chi tiêu" value={totalOut} color="#ef4444" />
            <StatCol label="Giao dịch" value={txs.length} isCount color="#94a3b8" />
          </div>

          {/* Transactions */}
          <div className="p-4 max-h-64 overflow-y-auto">
            <p className="text-xs text-slate-500 mb-3">Giao dịch gần đây</p>
            <div className="space-y-1">
              {txs.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">Chưa có giao dịch nào</p>
              ) : txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2">
                  <span className="text-base">{tx.categoryIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate">{tx.description}</p>
                    <p className="text-[10px] text-slate-600">{tx.categoryName}</p>
                  </div>
                  <span className={`blur-sensitive font-num text-xs font-semibold ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{fmtShort(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-white/[0.06] flex gap-2">
            <button
              onClick={() => setShowAddTx(true)}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-sm font-medium hover:bg-indigo-600/30 transition-colors"
            >
              + Giao dịch mới
            </button>
            <button
              onClick={() => { onClose(); window.location.href = '/transactions' }}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors"
            >
              Xem tất cả
            </button>
          </div>
        </div>
      </div>
      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} />}
    </div>
  )
}

function StatCol({ label, value, color, isCount }: { label: string; value: number; color: string; isCount?: boolean }) {
  return (
    <div className="flex flex-col items-center py-4">
      <p className="text-[10px] text-slate-600 mb-1">{label}</p>
      <p className="blur-sensitive font-num text-sm font-bold" style={{ color }}>
        {isCount ? value : fmtShort(value)}
      </p>
    </div>
  )
}

// ---- ADD ACCOUNT MODAL ----
function AddAccountModal({ onClose }: { onClose: () => void }) {
  const addAccount = useAppStore(s => s.addAccount)
  const [type, setType] = useState<'BANK_ACCOUNT' | 'CREDIT_CARD' | 'SAVINGS'>('BANK_ACCOUNT')
  const [name, setName] = useState('')
  const [bankName, setBankName] = useState('Vietcombank (VCB)')
  const [balance, setBalance] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [error, setError] = useState('')

  const TYPE_META: Record<typeof type, { icon: string; gradient: string; color: string }> = {
    BANK_ACCOUNT: { icon: '🏦', gradient: 'from-emerald-600 to-teal-700', color: '#10b981' },
    CREDIT_CARD: { icon: '💳', gradient: 'from-red-600 to-rose-700', color: '#ef4444' },
    SAVINGS: { icon: '🐷', gradient: 'from-lime-600 to-green-700', color: '#84cc16' },
  }

  const handleSave = () => {
    if (!name.trim()) { setError('Vui lòng nhập tên tài khoản'); return }
    const numBalance = parseInt(balance.replace(/\D/g, '') || '0')
    const meta = TYPE_META[type]
    addAccount({
      name: name.trim(),
      type,
      balance: type === 'CREDIT_CARD' ? -numBalance : numBalance,
      bankName: bankName || undefined,
      accountNumber: accountNumber.trim() || undefined,
      creditLimit: type === 'CREDIT_CARD' ? parseInt(creditLimit.replace(/\D/g, '') || '0') : undefined,
      icon: meta.icon,
      color: meta.color,
      gradient: meta.gradient,
    })
    onClose()
  }

  const handleBalanceChange = (val: string) => {
    const digits = val.replace(/\D/g, '')
    setBalance(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
  }
  const handleCreditChange = (val: string) => {
    const digits = val.replace(/\D/g, '')
    setCreditLimit(digits ? parseInt(digits).toLocaleString('vi-VN') : '')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">Thêm tài khoản mới</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
          </div>

          <div className="p-5 space-y-4">
            {/* Type tabs */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'BANK_ACCOUNT', label: '🏦 Ngân hàng' },
                { v: 'CREDIT_CARD', label: '💳 Thẻ tín dụng' },
                { v: 'SAVINGS', label: '🐷 Tiết kiệm' },
              ] as const).map(t => (
                <button key={t.v} onClick={() => setType(t.v)}
                  className={`py-2 rounded-xl text-[11px] font-medium transition-all
                    ${type === t.v ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/30' : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tên tài khoản</label>
              <input
                type="text"
                placeholder="VD: Vietcombank - Tài khoản chính"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Ngân hàng</label>
              <select value={bankName} onChange={e => setBankName(e.target.value)} className="select-field">
                <option>Vietcombank (VCB)</option>
                <option>Techcombank (TCB)</option>
                <option>MBBank (MBB)</option>
                <option>ACB</option>
                <option>BIDV</option>
                <option>VPBank</option>
                <option>TPBank</option>
                <option>Khác</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">
                  {type === 'CREDIT_CARD' ? 'Dư nợ ban đầu (₫)' : 'Số dư ban đầu (₫)'}
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={balance}
                  onChange={e => handleBalanceChange(e.target.value)}
                  className="input-field font-num"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">4 số cuối TK</label>
                <input
                  type="text"
                  placeholder="1234"
                  maxLength={4}
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="input-field font-num text-center"
                />
              </div>
            </div>

            {type === 'CREDIT_CARD' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Hạn mức (₫)</label>
                  <input
                    type="text"
                    placeholder="50.000.000"
                    value={creditLimit}
                    onChange={e => handleCreditChange(e.target.value)}
                    className="input-field font-num"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Ngày sao kê</label>
                  <input type="number" placeholder="25" min={1} max={31} className="input-field" />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button onClick={handleSave} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
              Tạo tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- UTILS ----
function getTypeLabel(type: string) {
  const m: Record<string, string> = {
    BANK_ACCOUNT: 'Tài khoản ngân hàng',
    CASH: 'Tiền mặt',
    CREDIT_CARD: 'Thẻ tín dụng',
    SAVINGS: 'Tiết kiệm',
    INVESTMENT: 'Đầu tư',
    E_WALLET: 'Ví điện tử',
  }
  return m[type] ?? type
}
function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}
function fmtShort(n: number) {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (a >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('vi-VN')
}
