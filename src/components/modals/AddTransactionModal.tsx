'use client'

import { useState } from 'react'
import { useAppStore, ALL_CATEGORIES } from '@/lib/store'

interface Props {
  onClose: () => void
}

export function AddTransactionModal({ onClose }: Props) {
  const accounts = useAppStore(s => s.accounts)
  const addTransaction = useAppStore(s => s.addTransaction)

  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [accountId, setAccountId] = useState(() => accounts[0]?.id ?? '')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) { setAmount(''); return }
    setAmount(parseInt(digits).toLocaleString('vi-VN'))
  }

  // Filter categories by type
  const expenseCats = ALL_CATEGORIES.filter(c => !['Lương', 'Thu nhập phụ'].includes(c.name))
  const incomeCats = ALL_CATEGORIES.filter(c => ['Lương', 'Thu nhập phụ', 'Khác'].includes(c.name))
  const transferCats = [
    { name: 'Tiết kiệm', icon: '🐷', budgetId: null as string | null },
    { name: 'Đầu tư', icon: '📈', budgetId: null as string | null },
    { name: 'Khác', icon: '📦', budgetId: null as string | null },
  ]
  const displayCats = type === 'INCOME' ? incomeCats : type === 'TRANSFER' ? transferCats : expenseCats

  const handleSave = () => {
    setError('')
    const numAmount = parseInt(amount.replace(/\D/g, '') || '0')
    if (numAmount <= 0) { setError('Vui lòng nhập số tiền hợp lệ'); return }
    if (!selectedCat) { setError('Vui lòng chọn danh mục'); return }
    const cat = ALL_CATEGORIES.find(c => c.name === selectedCat)
      ?? transferCats.find(c => c.name === selectedCat)
      ?? { name: selectedCat, icon: '📦' }
    addTransaction({
      accountId,
      type,
      amount: numAmount,
      description: desc.trim() || selectedCat,
      categoryName: cat.name,
      categoryIcon: cat.icon,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">Thêm giao dịch mới</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>

          {/* Type selector */}
          <div className="flex gap-1 p-4">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setType(t); setSelectedCat(null) }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                  ${type === t
                    ? t === 'INCOME' ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/30'
                      : t === 'TRANSFER' ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30'
                      : 'bg-red-600/25 text-red-400 border border-red-500/30'
                    : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'
                  }`}
              >
                {t === 'INCOME' ? '↑ Thu' : t === 'TRANSFER' ? '↔ Chuyển' : '↓ Chi'}
              </button>
            ))}
          </div>

          <div className="px-5 pb-6 space-y-4">
            {/* Amount */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Số tiền (₫)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={e => handleAmountChange(e.target.value)}
                  className="input-field font-num text-2xl font-bold pr-12 text-center"
                  style={{ fontSize: 28 }}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₫</span>
              </div>
            </div>

            {/* Account */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tài khoản</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="select-field">
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Mô tả / Ghi chú</label>
              <input
                type="text"
                placeholder="VD: Ăn tối nhà hàng, Xăng xe..."
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Danh mục</label>
              <div className="grid grid-cols-4 gap-2">
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
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[10px] text-center leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-xs text-red-400">{error}</p>}

            {/* Submit */}
            <button
              className="w-full py-3 rounded-xl font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-500 active:scale-95"
              onClick={handleSave}
            >
              Lưu giao dịch
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
