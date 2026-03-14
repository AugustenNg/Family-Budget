'use client'

import { useMemo, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAppStore } from '@/lib/store'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useIsApiMode } from '@/hooks/use-data-source'
import { useTransactions as useApiTransactions } from '@/hooks/queries/use-transactions'
import { useAccounts as useApiAccounts } from '@/hooks/queries/use-accounts'
import { useBudgets as useApiBudgets } from '@/hooks/queries/use-budgets'
import { useSummary as useApiSummary } from '@/hooks/queries/use-summary'

// ---- Mock family members (Phase 1: client-side)
// In Phase 2, this will come from Supabase family/members tables
const FAMILY_MEMBERS = [
  {
    id: 'm1',
    name: 'Nguyễn Văn Anh',
    role: 'Chủ hộ',
    avatar: 'A',
    color: '#6366f1',
    accountIds: ['acc-1', 'acc-3'], // mapped to store accounts by index
    monthlyIncome: 25_000_000,
    monthlyExpense: 14_500_000,
    emoji: '👨',
  },
  {
    id: 'm2',
    name: 'Nguyễn Thị Bình',
    role: 'Thành viên',
    avatar: 'B',
    color: '#ec4899',
    accountIds: ['acc-2', 'acc-4'],
    monthlyIncome: 20_000_000,
    monthlyExpense: 10_800_000,
    emoji: '👩',
  },
]

const SHARED_BUDGETS = [
  { name: 'Ăn uống gia đình', icon: '🍜', total: 10_000_000, m1: 5_500_000, m2: 4_500_000, color: '#ef4444' },
  { name: 'Điện nước & Internet', icon: '⚡', total: 4_000_000, m1: 2_200_000, m2: 1_800_000, color: '#f59e0b' },
  { name: 'Học phí con', icon: '🎓', total: 8_000_000, m1: 4_500_000, m2: 3_500_000, color: '#06b6d4' },
  { name: 'Nhà ở & Thuê nhà', icon: '🏠', total: 15_000_000, m1: 8_000_000, m2: 7_000_000, color: '#8b5cf6' },
]

export default function FamilyPage() {
  const isApi = useIsApiMode()

  const apiTx = useApiTransactions({})
  const apiAccounts = useApiAccounts()
  const apiBudgets = useApiBudgets()
  const apiSummary = useApiSummary()

  const storeAccounts = useAppStore(s => s.accounts)
  const storeTx = useAppStore(s => s.transactions)
  const storeBudgets = useAppStore(s => s.budgets)
  const storeSummary = useAppStore(s => s.getSummary())

  const accounts = isApi && apiAccounts.data ? apiAccounts.data as any[] : storeAccounts
  const transactions = isApi && apiTx.data ? apiTx.data.data as any[] : storeTx
  const budgets = isApi && apiBudgets.data ? apiBudgets.data as any[] : storeBudgets
  const summary = isApi && apiSummary.data ? apiSummary.data as any : storeSummary
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState<(typeof FAMILY_MEMBERS)[0] | null>(null)

  // Family totals from store
  const familyIncome = summary.monthlyIncome
  const familyExpense = summary.monthlyExpense
  const familySavings = Math.max(0, familyIncome - familyExpense)
  const familySavingsRate = familyIncome > 0 ? familySavings / familyIncome : 0

  // Comparison chart data
  const comparisonData = FAMILY_MEMBERS.map(m => ({
    name: m.avatar,
    fullName: m.name,
    income: m.monthlyIncome / 1_000_000,
    expense: m.monthlyExpense / 1_000_000,
    savings: Math.max(0, m.monthlyIncome - m.monthlyExpense) / 1_000_000,
    color: m.color,
  }))

  // Contribution pie data
  const totalHousehold = FAMILY_MEMBERS.reduce((s, m) => s + m.monthlyIncome, 0)

  // Recent shared transactions (all transactions this month)
  const now = new Date()
  const thisMonthTxs = useMemo(() => {
    return transactions
      .filter(tx => {
        const d = new Date(tx.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .slice(0, 10)
  }, [transactions])

  return (
    <div className="animate-fade-in">
      <Topbar title="Gia đình" subtitle="Quản lý tài chính chung toàn gia đình" />

      {/* ---- Family Overview Banner ---- */}
      <div className="card p-5 mb-6 border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-violet-950/20">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-xl">🏠</div>
          <div>
            <h2 className="text-base font-bold text-white">Gia đình Nguyễn</h2>
            <p className="text-xs text-slate-500">{FAMILY_MEMBERS.length} thành viên · CFO Family Finance</p>
          </div>
          <div className="ml-auto">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              summary.healthScore >= 70
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : summary.healthScore >= 50
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              Sức khỏe: {summary.healthScore}/100 {summary.healthScore >= 70 ? '💪' : summary.healthScore >= 50 ? '⚠️' : '🚨'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FamilyStatCard label="Tổng thu nhập" value={familyIncome} color="#10b981" icon="💰" />
          <FamilyStatCard label="Tổng chi tiêu" value={familyExpense} color="#ef4444" icon="💸" />
          <FamilyStatCard label="Tiết kiệm chung" value={familySavings} color="#6366f1" icon="🐷" />
          <div className="rounded-xl p-4" style={{ background: '#f59e0b0f', border: '1px solid #f59e0b20' }}>
            <div className="flex items-center gap-2 mb-2">
              <span>📊</span>
              <span className="text-[11px] text-slate-400">Tỷ lệ tiết kiệm</span>
            </div>
            <p className="font-num text-xl font-bold" style={{ color: familySavingsRate >= 0.2 ? '#10b981' : '#f59e0b' }}>
              {(familySavingsRate * 100).toFixed(0)}%
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(familySavingsRate * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ---- Member Cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {FAMILY_MEMBERS.map(member => {
          const memberSavings = member.monthlyIncome - member.monthlyExpense
          const memberSavingsRate = member.monthlyIncome > 0 ? memberSavings / member.monthlyIncome : 0
          const contribution = totalHousehold > 0 ? (member.monthlyIncome / totalHousehold) * 100 : 0

          return (
            <div
              key={member.id}
              className="card p-5 cursor-pointer hover:border-white/20 transition-all"
              onClick={() => setSelectedMember(member)}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: `${member.color}20`, border: `2px solid ${member.color}40` }}
                >
                  <span style={{ color: member.color }}>{member.avatar}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${contribution}%`, background: member.color }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{contribution.toFixed(0)}% thu nhập HGĐ</span>
                  </div>
                </div>
              </div>

              {/* Income/Expense cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Thu nhập T{now.getMonth() + 1}</p>
                  <p className="blur-sensitive font-num text-sm font-bold text-emerald-400">+{fmtShort(member.monthlyIncome)}</p>
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Chi tiêu T{now.getMonth() + 1}</p>
                  <p className="blur-sensitive font-num text-sm font-bold text-red-400">-{fmtShort(member.monthlyExpense)}</p>
                </div>
              </div>

              {/* Savings rate */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-slate-400">Tiết kiệm tháng này</span>
                  <span className="blur-sensitive font-num text-sm font-bold" style={{ color: memberSavings >= 0 ? '#10b981' : '#ef4444' }}>
                    {memberSavings >= 0 ? '+' : ''}{fmtShort(memberSavings)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min(Math.max(memberSavingsRate * 100, 0), 100)}%`, background: member.color }} />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: member.color }}>
                    {(memberSavingsRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-indigo-400 text-right mt-3">Xem chi tiết →</p>
            </div>
          )
        })}

        {/* Add member card */}
        <div
          onClick={() => setShowAddMember(true)}
          className="rounded-2xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-all p-8 min-h-48"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center text-2xl text-slate-500">+</div>
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">Mời thành viên</p>
            <p className="text-xs text-slate-600 mt-0.5">Chia sẻ quản lý tài chính gia đình</p>
          </div>
        </div>
      </div>

      {/* ---- Row 2: Comparison Chart + Shared Budgets ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Comparison Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">So Sánh Thu Chi</h3>
          <p className="text-xs text-slate-500 mb-4">Từng thành viên — Tháng {now.getMonth() + 1}/{now.getFullYear()} (triệu ₫)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData} barCategoryGap="40%" barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}tr`} />
              <Tooltip
                contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }}
                formatter={(v: number, name: string) => [`${v.toFixed(1)}tr`, name === 'income' ? 'Thu nhập' : name === 'expense' ? 'Chi tiêu' : 'Tiết kiệm']}
                labelFormatter={(label) => comparisonData.find(d => d.name === label)?.fullName ?? label}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="savings" name="savings" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {comparisonData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 justify-center mt-2">
            <LegendDot color="#10b981" label="Thu nhập" />
            <LegendDot color="#ef4444" label="Chi tiêu" />
            <LegendDot color="#6366f1" label="Tiết kiệm" />
          </div>

          {/* Contribution split */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[11px] text-slate-500 mb-3">Tỷ lệ đóng góp thu nhập HGĐ</p>
            <div className="flex gap-1 rounded-full overflow-hidden h-4">
              {FAMILY_MEMBERS.map(m => {
                const pct = totalHousehold > 0 ? (m.monthlyIncome / totalHousehold) * 100 : 50
                return (
                  <div key={m.id} className="flex items-center justify-center text-[9px] text-white font-bold"
                    style={{ width: `${pct}%`, background: m.color }}>
                    {pct.toFixed(0)}%
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              {FAMILY_MEMBERS.map(m => (
                <div key={m.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                  <span className="text-[10px] text-slate-500">{m.avatar}. {m.name.split(' ').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shared Budgets */}
        <div className="card p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Ngân Sách Chi Tiêu Chung</h3>
          <p className="text-xs text-slate-500 mb-4">Phân bổ và đóng góp chi phí từng thành viên</p>
          <div className="space-y-4">
            {SHARED_BUDGETS.map(budget => {
              const m1Pct = budget.total > 0 ? (budget.m1 / budget.total) * 100 : 50
              const m2Pct = 100 - m1Pct
              return (
                <div key={budget.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{budget.icon}</span>
                      <span className="text-xs text-slate-300">{budget.name}</span>
                    </div>
                    <span className="blur-sensitive font-num text-xs font-bold text-white">{fmtShort(budget.total)}</span>
                  </div>
                  {/* Split bar */}
                  <div className="flex gap-0.5 rounded-full overflow-hidden h-3 mb-1.5">
                    <div className="flex items-center justify-center"
                      style={{ width: `${m1Pct}%`, background: FAMILY_MEMBERS[0].color }}>
                      <span className="text-[8px] text-white font-bold">{m1Pct.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-center"
                      style={{ width: `${m2Pct}%`, background: FAMILY_MEMBERS[1].color }}>
                      <span className="text-[8px] text-white font-bold">{m2Pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>{FAMILY_MEMBERS[0].name.split(' ').pop()}: <span className="blur-sensitive text-slate-400">{fmtShort(budget.m1)}</span></span>
                    <span>{FAMILY_MEMBERS[1].name.split(' ').pop()}: <span className="blur-sensitive text-slate-400">{fmtShort(budget.m2)}</span></span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Tổng chi phí chung</span>
              <span className="blur-sensitive font-num text-white font-bold">
                {fmtShort(SHARED_BUDGETS.reduce((s, b) => s + b.total, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Row 3: Recent Family Transactions + Alerts ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Giao Dịch Gia Đình Gần Đây</h3>
            <span className="text-[10px] text-slate-600">Tháng {now.getMonth() + 1}/{now.getFullYear()}</span>
          </div>
          {thisMonthTxs.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-xs">Chưa có giao dịch tháng này</p>
            </div>
          ) : (
            <div className="space-y-1">
              {thisMonthTxs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-sm">{tx.categoryIcon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate font-medium">{tx.description}</p>
                    <p className="text-[10px] text-slate-600">{tx.categoryName} · {tx.accountName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`blur-sensitive font-num text-xs font-semibold ${tx.type === 'INCOME' ? 'text-income' : tx.type === 'TRANSFER' ? 'text-transfer' : 'text-expense'}`}>
                      {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '↔' : '-'}{fmtShort(tx.amount)}
                    </p>
                    <p className="text-[9px] text-slate-600">
                      {new Date(tx.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <a href="/transactions" className="block mt-4 text-xs text-center text-indigo-400 hover:text-indigo-300 transition-colors">
            Xem tất cả giao dịch →
          </a>
        </div>

        {/* Alerts & Goals */}
        <div className="space-y-4">
          {/* Family Alerts */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Cảnh Báo Gia Đình</h3>
            <div className="space-y-3">
              {budgets.filter(b => b.spent > b.budgeted).length > 0 ? (
                budgets.filter(b => b.spent > b.budgeted).slice(0, 3).map(b => (
                  <AlertCard
                    key={b.id}
                    icon="🔴"
                    title={`Vượt ngân sách ${b.categoryName}`}
                    desc={`Đã chi ${fmtShort(b.spent)} / ${fmtShort(b.budgeted)}`}
                    color="#ef4444"
                  />
                ))
              ) : (
                <AlertCard icon="✅" title="Tài chính ổn định" desc="Tất cả danh mục trong ngân sách" color="#10b981" />
              )}
              {summary.savingsRate < 0.1 && summary.monthlyIncome > 0 && (
                <AlertCard icon="⚠️" title="Tỷ lệ tiết kiệm thấp" desc={`Chỉ tiết kiệm được ${(summary.savingsRate * 100).toFixed(0)}% — mục tiêu 20%`} color="#f59e0b" />
              )}
              {summary.monthlyExpense > summary.monthlyIncome && (
                <AlertCard icon="🚨" title="Chi nhiều hơn thu" desc="Cần điều chỉnh chi tiêu ngay!" color="#ef4444" />
              )}
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Tóm Tắt Tháng {now.getMonth() + 1}</h3>
            <div className="space-y-3">
              <SummaryRow label="Tổng thu nhập HGĐ" value={`+${fmtShort(familyIncome)}`} color="#10b981" />
              <SummaryRow label="Tổng chi tiêu HGĐ" value={`-${fmtShort(familyExpense)}`} color="#ef4444" />
              <SummaryRow label="Tiết kiệm được" value={`${familySavings >= 0 ? '+' : ''}${fmtShort(familySavings)}`} color={familySavings >= 0 ? '#6366f1' : '#ef4444'} />
              <div className="pt-2 border-t border-white/[0.06]">
                <SummaryRow label="Tài sản ròng HGĐ" value={fmtShort(summary.netWorth)} color="#f59e0b" bold />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Invite Member Modal ---- */}
      {showAddMember && <InviteMemberModal onClose={() => setShowAddMember(false)} />}

      {/* ---- Member Detail Modal ---- */}
      {selectedMember && <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
    </div>
  )
}

// ---- SUB-COMPONENTS ----

function FamilyStatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: string
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: `${color}0f`, border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] text-slate-400">{label}</span>
      </div>
      <p className="blur-sensitive font-num text-xl font-bold" style={{ color }}>{fmtShort(value)}</p>
    </div>
  )
}

function AlertCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <span className="text-base flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-medium" style={{ color }}>{title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`blur-sensitive font-num text-xs font-${bold ? 'bold' : 'semibold'}`} style={{ color }}>{value}</span>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  )
}

// ---- INVITE MEMBER MODAL ----
function InviteMemberModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Thành viên')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-t-2xl sm:rounded-2xl mx-4 sm:mx-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white">Mời thành viên gia đình</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-xs text-indigo-400">
                🔒 <strong>Phase 2:</strong> Tính năng mời thành viên qua email và đồng bộ real-time sẽ được ra mắt sau khi kết nối Supabase. Hiện tại đang hiển thị dữ liệu mẫu.
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tên thành viên</label>
              <input type="text" placeholder="VD: Nguyễn Văn C" value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
              <input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Vai trò</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="select-field">
                <option>Thành viên</option>
                <option>Xem chỉ đọc</option>
                <option>Chủ hộ</option>
              </select>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-sm transition-colors"
            >
              Gửi lời mời (Phase 2)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- MEMBER DETAIL MODAL ----
function MemberDetailModal({ member, onClose }: { member: typeof FAMILY_MEMBERS[0]; onClose: () => void }) {
  const transactions = useAppStore(s => s.transactions)
  const now = new Date()

  // Show recent transactions for this member (by account names — simplified for Phase 1)
  const recentTxs = transactions.slice(0, 5)
  const memberSavings = member.monthlyIncome - member.monthlyExpense
  const memberSavingsRate = member.monthlyIncome > 0 ? memberSavings / member.monthlyIncome : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="card-glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6" style={{ background: `linear-gradient(135deg, ${member.color}25, ${member.color}10)` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold"
                  style={{ background: `${member.color}30`, border: `2px solid ${member.color}50` }}>
                  <span style={{ color: member.color }}>{member.avatar}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{member.name}</h2>
                  <p className="text-sm text-slate-400">{member.role}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
            <StatCol label="Thu nhập" value={`+${fmtShort(member.monthlyIncome)}`} color="#10b981" />
            <StatCol label="Chi tiêu" value={`-${fmtShort(member.monthlyExpense)}`} color="#ef4444" />
            <StatCol label="Tiết kiệm" value={`${memberSavingsRate >= 0 ? '' : '-'}${(Math.abs(memberSavingsRate) * 100).toFixed(0)}%`} color={member.color} />
          </div>

          {/* Recent Transactions */}
          <div className="p-5">
            <p className="text-xs text-slate-500 mb-3">Giao dịch gần đây</p>
            <div className="space-y-2">
              {recentTxs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
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

          <div className="px-5 pb-5">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCol({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-3">
      <p className="text-[10px] text-slate-600 mb-0.5">{label}</p>
      <p className="blur-sensitive font-num text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

// ---- UTILS ----
function fmtShort(n: number) {
  const a = Math.abs(n)
  if (a >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (a >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('vi-VN')
}
