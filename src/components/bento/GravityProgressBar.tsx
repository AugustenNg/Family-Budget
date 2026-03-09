'use client'

import { useEffect, useRef, useState } from 'react'
import type { Budget } from '@/lib/mock-data'

interface GravityProgressBarProps {
  budget: Budget
  animate?: boolean
}

export function GravityProgressBar({ budget, animate = true }: GravityProgressBarProps) {
  const percent = Math.min((budget.spent / budget.budgeted) * 100, 110)
  const isOver = percent >= 100
  const isWarning = percent >= 80 && percent < 100
  const [width, setWidth] = useState(animate ? 0 : percent)
  const started = useRef(false)

  useEffect(() => {
    if (animate && !started.current) {
      started.current = true
      const timer = setTimeout(() => setWidth(percent), 100)
      return () => clearTimeout(timer)
    }
  }, [animate, percent])

  const barColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : budget.color
  const remaining = budget.budgeted - budget.spent

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n / 1000)) + 'k'

  return (
    <div className="group">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{budget.categoryIcon}</span>
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
            {budget.categoryName}
          </span>
          {isOver && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 font-medium">
              Vượt!
            </span>
          )}
          {isWarning && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-medium">
              Gần hết
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="blur-sensitive font-num text-xs font-semibold" style={{ color: barColor }}>
            {fmt(budget.spent)}
          </span>
          <span className="text-slate-600 text-xs"> / </span>
          <span className="blur-sensitive font-num text-xs text-slate-400">{fmt(budget.budgeted)}</span>
        </div>
      </div>

      {/* Track */}
      <div className="gravity-bar-track">
        {/* Fill */}
        <div
          className={`gravity-bar-fill ${isOver ? 'gravity-bar-danger' : ''}`}
          style={{
            width: `${Math.min(width, 100)}%`,
            background: isOver
              ? 'linear-gradient(90deg, #dc2626, #ef4444)'
              : isWarning
              ? 'linear-gradient(90deg, #d97706, #f59e0b)'
              : `linear-gradient(90deg, ${budget.color}cc, ${budget.color})`,
            boxShadow: `0 0 8px ${barColor}50`,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Overflow indicator */}
        {isOver && (
          <div
            className="absolute right-0 top-0 bottom-0 rounded-r-full bg-red-500/30"
            style={{ width: `${Math.min(percent - 100, 10)}%` }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-600">{percent.toFixed(0)}% đã dùng</span>
        <span className="blur-sensitive font-num text-[10px]" style={{ color: isOver ? '#ef4444' : '#64748b' }}>
          {isOver
            ? `Vượt ${fmt(Math.abs(remaining))}`
            : `Còn ${fmt(remaining)}`}
        </span>
      </div>
    </div>
  )
}
