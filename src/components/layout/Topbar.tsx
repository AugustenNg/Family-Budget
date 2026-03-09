'use client'

import { useState } from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
  onAdd?: () => void
}

export function Topbar({ title, subtitle, onAdd }: TopbarProps) {
  const [incognito, setIncognito] = useState(false)

  // Toggle incognito mode on body
  const toggleIncognito = () => {
    const next = !incognito
    setIncognito(next)
    document.body.classList.toggle('incognito-mode', next)
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Date */}
        <span className="hidden md:block text-xs text-slate-600 capitalize">{dateStr}</span>

        {/* Incognito toggle */}
        <button
          onClick={toggleIncognito}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${incognito
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-white/5 text-slate-500 border border-white/08 hover:bg-white/8'
            }`}
          title={incognito ? 'Bật hiển thị số' : 'Ẩn số (chế độ riêng tư)'}
        >
          {incognito ? <EyeOffIcon /> : <EyeIcon />}
          <span className="hidden sm:inline">{incognito ? 'Đang ẩn' : 'Ẩn số'}</span>
        </button>

        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/08 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
          <BellIcon />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-slate-950" />
        </button>

        {/* Add transaction button */}
        <button
          onClick={onAdd}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium transition-colors
            ${onAdd ? 'hover:bg-indigo-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
        >
          <PlusIcon />
          <span className="hidden sm:inline">Thêm</span>
        </button>
      </div>
    </header>
  )
}

function EyeIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
    </svg>
  )
}
