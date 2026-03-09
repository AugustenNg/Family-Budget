'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/', icon: GridIcon, label: 'Dashboard' },
  { href: '/transactions', icon: ListIcon, label: 'Giao dịch' },
  { href: '/budget', icon: PieIcon, label: 'Ngân sách' },
  { href: '/accounts', icon: WalletIcon, label: 'Tài khoản' },
  { href: '/wealth', icon: TrendingIcon, label: 'Tài sản & Nợ' },
  { href: '/reports', icon: BarIcon, label: 'Báo cáo' },
  { href: '/family', icon: UsersIcon, label: 'Gia đình' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-300"
      style={{ width: collapsed ? 64 : 220 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950/95 border-r border-white/[0.06] backdrop-blur-xl" />

      <div className="relative flex flex-col h-full py-4 px-3">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">CFO</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-white leading-tight">CFO Family</p>
              <p className="text-[10px] text-slate-500">Tài chính gia đình</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-600 hover:text-slate-400 transition-colors"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-white/[0.06] my-3" />

        {/* Bottom: Settings + User */}
        <div className="space-y-0.5">
          <Link href="/settings" className={`sidebar-item ${collapsed ? 'justify-center px-0' : ''}`}>
            <SettingsIcon size={18} />
            {!collapsed && <span>Cài đặt</span>}
          </Link>

          <div className={`flex items-center gap-3 px-3 py-2 mt-1 rounded-xl ${collapsed ? 'justify-center px-0' : ''}`}>
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">Nguyễn Văn Anh</p>
                <p className="text-[10px] text-slate-600 truncate">Chủ hộ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

// ---- ICONS ----
function GridIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function ListIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" strokeLinecap="round" />
    </svg>
  )
}
function PieIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" strokeLinecap="round" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" strokeLinecap="round" />
    </svg>
  )
}
function WalletIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
      <circle cx="17" cy="12" r="1.5" fill="currentColor" />
      <path d="M17 7V5" strokeLinecap="round" />
    </svg>
  )
}
function TrendingIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 7 22 7 22 13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
    </svg>
  )
}
function UsersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  )
}
function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" />
    </svg>
  )
}
function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
