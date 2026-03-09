'use client'

import { useMemo } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAppStore } from '@/lib/store'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#94a3b8']

export default function ReportsPage() {
  const transactions = useAppStore(s => s.transactions)
  const budgets = useAppStore(s => s.budgets)
  const accounts = useAppStore(s => s.accounts)
  const summary = useAppStore(s => s.getSummary())

  // ---- Compute monthly data (last 6 months) ----
  const monthlyData = useMemo(() => {
    const months: { key: string; label: string; income: number; expense: number; savings: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `T${d.getMonth() + 1}`
      months.push({ key, label, income: 0, expense: 0, savings: 0 })
    }
    transactions.forEach(tx => {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const m = months.find(m => m.key === key)
      if (!m) return
      if (tx.type === 'INCOME') m.income += tx.amount / 1_000_000
      if (tx.type === 'EXPENSE') m.expense += tx.amount / 1_000_000
    })
    months.forEach(m => { m.savings = Math.max(0, m.income - m.expense) })
    return months
  }, [transactions])

  // ---- Expense by category ----
  const categoryData = useMemo(() => {
    const cats: Record<string, { name: string; value: number; icon: string }> = {}
    transactions
      .filter(tx => tx.type === 'EXPENSE')
      .forEach(tx => {
        if (!cats[tx.categoryName]) {
          cats[tx.categoryName] = { name: tx.categoryName, value: 0, icon: tx.categoryIcon }
        }
        cats[tx.categoryName].value += tx.amount
      })
    return Object.values(cats)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [transactions])

  // ---- Budget vs Actual ----
  const budgetVsActual = useMemo(() => {
    return budgets.map(b => ({
      name: `${b.categoryIcon} ${b.categoryName.replace('& ', '&\n')}`,
      budgeted: b.budgeted / 1_000_000,
      spent: b.spent / 1_000_000,
      remaining: Math.max(0, b.budgeted - b.spent) / 1_000_000,
    }))
  }, [budgets])

  // ---- Income breakdown ----
  const incomeData = useMemo(() => {
    const cats: Record<string, { name: string; value: number }> = {}
    transactions
      .filter(tx => tx.type === 'INCOME')
      .forEach(tx => {
        if (!cats[tx.categoryName]) cats[tx.categoryName] = { name: tx.categoryName, value: 0 }
        cats[tx.categoryName].value += tx.amount
      })
    return Object.values(cats).sort((a, b) => b.value - a.value)
  }, [transactions])

  // ---- Cumulative savings trend ----
  const savingsTrend = useMemo(() => {
    let cumulative = 0
    return monthlyData.map(m => {
      cumulative += m.savings
      return { ...m, cumulative: parseFloat(cumulative.toFixed(1)) }
    })
  }, [monthlyData])

  const totalExpenseThisMonth = summary.monthlyExpense
  const totalIncomeThisMonth = summary.monthlyIncome

  return (
    <div className="animate-fade-in">
      <Topbar title="Báo cáo" subtitle="Phân tích tài chính chuyên sâu" />

      {/* ---- KPI Row ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Thu nhập tháng này"
          value={fmtShort(totalIncomeThisMonth)}
          sub={`${transactions.filter(t => t.type === 'INCOME').length} giao dịch`}
          color="#10b981" icon="💰"
        />
        <KpiCard
          label="Chi tiêu tháng này"
          value={fmtShort(totalExpenseThisMonth)}
          sub={`${transactions.filter(t => t.type === 'EXPENSE').length} giao dịch`}
          color="#ef4444" icon="💸"
        />
        <KpiCard
          label="Tiết kiệm tháng này"
          value={fmtShort(Math.max(0, totalIncomeThisMonth - totalExpenseThisMonth))}
          sub={totalIncomeThisMonth > 0 ? `Tỷ lệ ${((Math.max(0, totalIncomeThisMonth - totalExpenseThisMonth) / totalIncomeThisMonth) * 100).toFixed(0)}%` : 'Chưa có thu nhập'}
          color="#6366f1" icon="🐷"
        />
        <KpiCard
          label="Tài sản ròng"
          value={fmtShort(summary.netWorth)}
          sub={`${budgets.filter(b => b.spent <= b.budgeted).length}/${budgets.length} ngân sách OK`}
          color="#f59e0b" icon="📈"
        />
      </div>

      {/* ---- Row 1: Monthly Income vs Expense + Category Pie ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        {/* Monthly bar chart */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Thu Chi 6 Tháng Gần Nhất</h3>
              <p className="text-xs text-slate-500 mt-0.5">So sánh thu nhập và chi tiêu theo tháng (triệu ₫)</p>
            </div>
          </div>
          {monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barCategoryGap="30%" barGap={4}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}tr`} />
                <Tooltip
                  contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}tr`, name === 'income' ? 'Thu nhập' : name === 'expense' ? 'Chi tiêu' : 'Tiết kiệm']}
                  labelStyle={{ color: '#94a3b8' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="savings" name="savings" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon="📊" msg="Chưa có dữ liệu giao dịch" />
          )}
          <div className="flex gap-4 mt-3 justify-center">
            <LegendDot color="#10b981" label="Thu nhập" />
            <LegendDot color="#ef4444" label="Chi tiêu" />
            <LegendDot color="#6366f1" label="Tiết kiệm" />
          </div>
        </div>

        {/* Category Pie */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Chi Tiêu Theo Danh Mục</h3>
          <p className="text-xs text-slate-500 mb-4">Phân bổ % tổng chi tiêu</p>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }}
                    formatter={(v: number) => [fmtShort(v), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {categoryData.slice(0, 5).map(cat => {
                  const total = categoryData.reduce((s, c) => s + c.value, 0)
                  const pct = total > 0 ? (cat.value / total * 100).toFixed(0) : '0'
                  return (
                    <div key={cat.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-slate-400 flex-1 truncate">{cat.icon} {cat.name}</span>
                      <span className="text-slate-300 font-mono font-medium">{pct}%</span>
                      <span className="text-slate-500 font-mono">{fmtShort(cat.value)}</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyChart icon="🥧" msg="Chưa có chi tiêu nào" />
          )}
        </div>
      </div>

      {/* ---- Row 2: Budget vs Actual + Savings Trend ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Budget vs Actual */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Ngân Sách vs Thực Tế</h3>
          <p className="text-xs text-slate-500 mb-4">Hạn mức đặt ra so với chi tiêu thực tế (triệu ₫)</p>
          {budgetVsActual.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetVsActual} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}tr`} />
                <YAxis
                  type="category" dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false} axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }}
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}tr`, name === 'budgeted' ? 'Hạn mức' : 'Đã chi']}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="budgeted" name="budgeted" fill="rgba(99,102,241,0.25)" radius={[0, 4, 4, 0]} maxBarSize={16} />
                <Bar dataKey="spent" name="spent" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {budgetVsActual.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.spent > entry.budgeted ? '#ef4444' : entry.spent / (entry.budgeted || 1) > 0.85 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon="🎯" msg="Chưa có ngân sách nào. Hãy thêm ngân sách!" />
          )}
          <div className="flex gap-4 mt-3 justify-center">
            <LegendDot color="rgba(99,102,241,0.6)" label="Hạn mức" />
            <LegendDot color="#10b981" label="Trong ngân sách" />
            <LegendDot color="#ef4444" label="Vượt ngân sách" />
          </div>
        </div>

        {/* Cumulative Savings Trend */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Xu Hướng Tiết Kiệm Lũy Kế</h3>
          <p className="text-xs text-slate-500 mb-4">Tổng tiết kiệm cộng dồn 6 tháng (triệu ₫)</p>
          {savingsTrend.some(m => m.savings > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={savingsTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}tr`} />
                <Tooltip
                  contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }}
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}tr`, name === 'savings' ? 'Tiết kiệm tháng' : 'Lũy kế']}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} fill="url(#savGrad)" dot={{ fill: '#10b981', r: 3 }} name="savings" />
                <Area type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} fill="url(#cumGrad)" dot={{ fill: '#6366f1', r: 3 }} name="cumulative" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon="💹" msg="Chưa đủ dữ liệu để hiển thị xu hướng" />
          )}
          <div className="flex gap-4 mt-3 justify-center">
            <LegendDot color="#10b981" label="Tiết kiệm tháng" />
            <LegendDot color="#6366f1" label="Lũy kế" />
          </div>
        </div>
      </div>

      {/* ---- Row 3: Account Balances + Income Sources ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Account Balances */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Số Dư Tài Khoản</h3>
          <div className="space-y-3">
            {accounts
              .filter(a => a.balance !== 0)
              .sort((a, b) => b.balance - a.balance)
              .map(acc => {
                const maxBalance = Math.max(...accounts.map(a => Math.abs(a.balance)))
                const pct = maxBalance > 0 ? Math.abs(acc.balance) / maxBalance * 100 : 0
                const isNegative = acc.balance < 0
                return (
                  <div key={acc.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{acc.icon}</span>
                        <span className="text-xs text-slate-300">{acc.name}</span>
                        <span className="text-[10px] text-slate-600">{acc.bankName ?? getTypeLabel(acc.type)}</span>
                      </div>
                      <span className={`blur-sensitive font-num text-xs font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isNegative ? '-' : '+'}{fmtShort(Math.abs(acc.balance))}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: isNegative ? '#ef4444' : acc.color ?? '#10b981' }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-[10px] text-slate-500 mb-0.5">Tổng tài sản</p>
              <p className="blur-sensitive font-num text-sm font-bold text-emerald-400">{fmtShort(summary.totalAssets)}</p>
            </div>
            <div className="rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-[10px] text-slate-500 mb-0.5">Thanh khoản ròng</p>
              <p className="blur-sensitive font-num text-sm font-bold text-indigo-400">{fmtShort(summary.liquidAssets)}</p>
            </div>
          </div>
        </div>

        {/* Income Sources */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Nguồn Thu Nhập</h3>
          {incomeData.length > 0 ? (
            <div className="space-y-4">
              {incomeData.map((inc, i) => {
                const total = incomeData.reduce((s, c) => s + c.value, 0)
                const pct = total > 0 ? inc.value / total * 100 : 0
                const color = CHART_COLORS[i % CHART_COLORS.length]
                return (
                  <div key={inc.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-300">{inc.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{pct.toFixed(0)}%</span>
                        <span className="blur-sensitive font-num text-xs font-bold text-emerald-400">+{fmtShort(inc.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyChart icon="💰" msg="Chưa có giao dịch thu nhập nào" />
          )}

          {/* Savings Rate Indicator */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Tỷ lệ tiết kiệm tháng này</p>
              <p className="font-num text-sm font-bold" style={{
                color: summary.savingsRate >= 0.2 ? '#10b981' : summary.savingsRate >= 0.1 ? '#f59e0b' : '#ef4444'
              }}>
                {(summary.savingsRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-indigo-600 to-emerald-500"
                style={{ width: `${Math.min(Math.max(summary.savingsRate * 100, 0), 100)}%` }} />
              {/* Target marker at 20% */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-white/30" style={{ left: '20%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>0%</span>
              <span className="text-slate-500">Mục tiêu 20%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Row 4: Transaction Summary Table ---- */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Bảng Tổng Kết Danh Mục Chi Tiêu</h3>
          <span className="text-[10px] text-slate-500">{transactions.filter(t => t.type === 'EXPENSE').length} giao dịch chi tiêu</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2.5 text-slate-500 font-medium">Danh mục</th>
                <th className="text-right py-2.5 text-slate-500 font-medium">Tổng chi</th>
                <th className="text-right py-2.5 text-slate-500 font-medium">Hạn mức</th>
                <th className="text-right py-2.5 text-slate-500 font-medium">Còn lại</th>
                <th className="text-right py-2.5 text-slate-500 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((cat, i) => {
                const budget = budgets.find(b => b.categoryName === cat.name || b.categoryName.includes(cat.name.split(' ')[0]))
                const remaining = budget ? budget.budgeted - cat.value : null
                return (
                  <tr key={cat.name} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                        <span>{cat.icon}</span>
                        <span className="text-slate-300">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right blur-sensitive font-num text-red-400 font-medium">
                      {fmtShort(cat.value)}
                    </td>
                    <td className="py-3 text-right text-slate-500 font-mono">
                      {budget ? fmtShort(budget.budgeted) : '—'}
                    </td>
                    <td className="py-3 text-right font-mono font-medium"
                      style={{ color: remaining === null ? '#64748b' : remaining >= 0 ? '#10b981' : '#ef4444' }}>
                      {remaining !== null ? (remaining >= 0 ? '+' : '') + fmtShort(remaining) : '—'}
                    </td>
                    <td className="py-3 text-right">
                      {budget
                        ? <StatusBadge spent={cat.value} budgeted={budget.budgeted} />
                        : <span className="text-[10px] text-slate-600 px-2 py-0.5 rounded-full bg-white/[0.04]">Chưa phân bổ</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.08]">
                <td className="py-3 text-slate-400 font-medium">Tổng cộng</td>
                <td className="py-3 text-right blur-sensitive font-num text-white font-bold">
                  {fmtShort(categoryData.reduce((s, c) => s + c.value, 0))}
                </td>
                <td className="py-3 text-right font-mono text-slate-400 font-medium">
                  {fmtShort(budgets.reduce((s, b) => s + b.budgeted, 0))}
                </td>
                <td className="py-3 text-right font-mono font-bold text-emerald-400">
                  {fmtShort(budgets.reduce((s, b) => s + Math.max(0, b.budgeted - b.spent), 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---- SUB-COMPONENTS ----

function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub: string; color: string; icon: string
}) {
  return (
    <div className="card p-4" style={{ borderColor: `${color}20` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <p className="blur-sensitive font-num text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
    </div>
  )
}

function StatusBadge({ spent, budgeted }: { spent: number; budgeted: number }) {
  const pct = budgeted > 0 ? spent / budgeted : 0
  if (pct > 1) return <span className="text-[10px] text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">⚠️ Vượt {((pct - 1) * 100).toFixed(0)}%</span>
  if (pct > 0.85) return <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">⚡ Sắp hết</span>
  return <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">✓ Ổn</span>
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  )
}

function EmptyChart({ icon, msg }: { icon: string; msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-600">
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-xs text-center">{msg}</span>
    </div>
  )
}

// ---- UTILS ----
function fmtShort(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('vi-VN')
}

function getTypeLabel(type: string) {
  const m: Record<string, string> = {
    BANK_ACCOUNT: 'Ngân hàng', CASH: 'Tiền mặt', CREDIT_CARD: 'Thẻ TD',
    SAVINGS: 'Tiết kiệm', INVESTMENT: 'Đầu tư', E_WALLET: 'Ví điện tử',
  }
  return m[type] ?? type
}
