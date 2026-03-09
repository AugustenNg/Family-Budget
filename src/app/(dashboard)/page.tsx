'use client'

import { useState } from 'react'
import { HeartbeatPulse } from '@/components/bento/HeartbeatPulse'
import { FlipCard } from '@/components/bento/FlipCard'
import { GravityProgressBar } from '@/components/bento/GravityProgressBar'
import { Topbar } from '@/components/layout/Topbar'
import { useAppStore } from '@/lib/store'
import { mockNetWorthHistory } from '@/lib/mock-data'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'

// Recharts
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function DashboardPage() {
  const transactions = useAppStore(s => s.transactions)
  const accounts = useAppStore(s => s.accounts)
  const budgets = useAppStore(s => s.budgets)
  const summary = useAppStore(s => s.getSummary())

  const [showAddTx, setShowAddTx] = useState(false)

  const recentTx = transactions.slice(0, 7)
  const topBudgets = budgets.slice(0, 5)
  const displayAccounts = accounts.slice(0, 4)

  const savings = summary.monthlyIncome - summary.monthlyExpense

  const overBudgets = budgets.filter(b => b.spent > b.budgeted)
  const nearBudgets = budgets.filter(b => b.spent <= b.budgeted && b.budgeted > 0 && b.spent / b.budgeted > 0.85)

  return (
    <div className="animate-fade-in">
      <Topbar
        title="Dashboard"
        subtitle="Trung tâm kiểm soát tài chính gia đình"
        onAdd={() => setShowAddTx(true)}
      />
      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} />}

      {/* BENTO GRID */}
      <div className="grid gap-4" style={{
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr)',
        gridTemplateRows: 'auto auto',
      }}>

        {/* ---- WIDGET 1: HEARTBEAT PULSE ---- */}
        <div className="card p-5 row-span-1" style={{ minHeight: 300 }}>
          <SectionLabel icon="💓" title="Sức khỏe Dòng tiền" />
          <HeartbeatPulse
            score={summary.healthScore}
            income={summary.monthlyIncome}
            expense={summary.monthlyExpense}
            savings={savings}
          />
        </div>

        {/* ---- WIDGET 2: ACCOUNTS (Flip Cards grid) ---- */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel icon="💳" title="Tài khoản" />
            <a href="/accounts" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Xem tất cả →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {displayAccounts.map(acc => (
              <FlipCard key={acc.id} account={acc} />
            ))}
          </div>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <SummaryPill label="Tài sản" value={summary.totalAssets} positive />
            <SummaryPill
              label="Dư nợ thẻ"
              value={Math.abs(accounts.filter(a => a.type === 'CREDIT_CARD').reduce((s, a) => s + Math.min(0, a.balance), 0))}
              negative
            />
            <SummaryPill label="Thanh khoản" value={summary.liquidAssets} positive />
          </div>
        </div>

        {/* ---- WIDGET 3: NET WORTH CHART ---- */}
        <div className="card p-5">
          <SectionLabel icon="📈" title="Tài sản ròng" />
          <div className="mt-3">
            <p className="text-slate-500 text-xs mb-0.5">Dư nợ ròng hiện tại</p>
            <p className="blur-sensitive font-num text-2xl font-bold text-white">
              {formatVNDShort(summary.netWorth)}
            </p>
            <p className="text-emerald-400 text-xs mt-0.5 flex items-center gap-1">
              <span>↑</span> Tăng 5.5tr so với tháng trước
            </p>
          </div>
          <div className="mt-4" style={{ height: 150 }}>
            <NetWorthMiniChart />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-slate-500">Tổng tài sản</p>
              <p className="blur-sensitive font-num text-sm font-semibold text-emerald-400 mt-0.5">
                {formatVNDShort(summary.totalAssets)}
              </p>
            </div>
            <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-slate-500">Tổng nợ</p>
              <p className="blur-sensitive font-num text-sm font-semibold text-red-400 mt-0.5">
                {formatVNDShort(summary.totalLiabilities)}
              </p>
            </div>
          </div>
        </div>

        {/* ---- WIDGET 4: BUDGET GRAVITY BARS ---- */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel icon="🎯" title="Ngân sách tháng" />
            <a href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Quản lý →
            </a>
          </div>
          <div className="space-y-4">
            {topBudgets.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">Chưa có ngân sách nào</p>
            ) : topBudgets.map(b => (
              <GravityProgressBar key={b.id} budget={b} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between">
            <div>
              <p className="text-xs text-slate-500">Đã chi</p>
              <p className="blur-sensitive font-num text-sm font-bold text-white mt-0.5">
                {formatVNDShort(topBudgets.reduce((s, b) => s + b.spent, 0))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Còn lại</p>
              <p className="blur-sensitive font-num text-sm font-bold text-emerald-400 mt-0.5">
                {formatVNDShort(topBudgets.reduce((s, b) => s + Math.max(0, b.budgeted - b.spent), 0))}
              </p>
            </div>
          </div>
        </div>

        {/* ---- WIDGET 5: RECENT TRANSACTIONS ---- */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel icon="📋" title="Giao dịch gần đây" />
            <a href="/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Xem tất cả →
            </a>
          </div>
          <div className="space-y-1">
            {recentTx.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">Chưa có giao dịch nào</p>
            ) : recentTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-base">
                  {tx.categoryIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate font-medium">{tx.description}</p>
                  <p className="text-[11px] text-slate-600">
                    {tx.categoryName} · {formatDate(new Date(tx.date))}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`blur-sensitive font-num text-sm font-semibold ${tx.type === 'INCOME' ? 'text-income' : tx.type === 'TRANSFER' ? 'text-transfer' : 'text-expense'}`}>
                    {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '↔' : '-'}
                    {formatVNDShort(tx.amount)}
                  </p>
                  <p className="text-[10px] text-slate-600">{tx.accountName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- WIDGET 6: QUICK STATS ---- */}
        <div className="card p-5">
          <SectionLabel icon="⚡" title="Tóm tắt nhanh" />
          <div className="space-y-3 mt-4">
            <QuickStat
              label="Tỷ lệ tiết kiệm tháng này"
              value={`${(summary.savingsRate * 100).toFixed(0)}%`}
              sub="Mục tiêu: 20%"
              color="#10b981"
              progress={summary.savingsRate / 0.20}
            />
            <QuickStat
              label="Tuân thủ ngân sách"
              value={`${(summary.budgetCompliance * 100).toFixed(0)}%`}
              sub={`${budgets.filter(b => b.spent <= b.budgeted).length}/${budgets.length} danh mục trong ngân sách`}
              color="#6366f1"
              progress={summary.budgetCompliance}
            />
            <QuickStat
              label="Quỹ khẩn cấp"
              value={`${summary.monthlyExpense > 0 ? (summary.liquidAssets / summary.monthlyExpense).toFixed(1) : '–'} tháng`}
              sub="Mục tiêu: 6 tháng"
              color="#f59e0b"
              progress={summary.monthlyExpense > 0 ? Math.min(summary.liquidAssets / summary.monthlyExpense / 6, 1) : 0}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500 mb-3">Cảnh báo hệ thống</p>
            <div className="space-y-2">
              {overBudgets.length > 0
                ? overBudgets.slice(0, 2).map(b => (
                    <AlertItem key={b.id} icon="🔴" text={`Ngân sách ${b.categoryName} vượt ${((b.spent / b.budgeted - 1) * 100).toFixed(1)}%`} />
                  ))
                : <AlertItem icon="✅" text="Tất cả danh mục trong ngân sách" />
              }
              {nearBudgets.slice(0, 1).map(b => (
                <AlertItem key={b.id} icon="🟡" text={`${b.categoryName} sắp hết (${((b.spent / b.budgeted) * 100).toFixed(0)}%)`} />
              ))}
              {accounts.filter(a => a.type === 'CREDIT_CARD').slice(0, 1).map(a => (
                <AlertItem key={a.id} icon="💳" text={`${a.name}: Theo dõi dư nợ thẻ tín dụng`} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ---- SUB-COMPONENTS ----

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-base">{icon}</span>
      <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
    </div>
  )
}

function SummaryPill({ label, value, positive, negative }: { label: string; value: number; positive?: boolean; negative?: boolean }) {
  const color = positive ? '#10b981' : negative ? '#ef4444' : '#94a3b8'
  return (
    <div className="rounded-xl p-2.5" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="blur-sensitive font-num text-xs font-bold mt-0.5" style={{ color }}>
        {formatVNDShort(value)}
      </p>
    </div>
  )
}

function QuickStat({ label, value, sub, color, progress }: {
  label: string; value: string; sub: string; color: string; progress: number
}) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-[10px] text-slate-600">{sub}</p>
        </div>
        <span className="font-num text-sm font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(Math.max(progress * 100, 0), 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}

function AlertItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className="text-sm">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function NetWorthMiniChart() {
  const data = mockNetWorthHistory.map(d => ({
    month: d.month,
    net: Math.abs(d.net) / 1_000_000,
    assets: d.assets / 1_000_000,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
          formatter={(v: number) => [`${v.toFixed(1)}tr`, '']}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Area type="monotone" dataKey="assets" stroke="#10b981" strokeWidth={1.5} fill="url(#assetGrad)" dot={false} name="Tài sản" />
        <Area type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={1.5} fill="url(#netGrad)" dot={false} name="Dư nợ ròng" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---- UTILS ----
function formatVNDShort(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('vi-VN')
}

function formatDate(d: Date) {
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  return `${diff} ngày trước`
}
