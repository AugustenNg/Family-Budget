'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <Topbar title="Cài đặt" subtitle="Tùy chỉnh ứng dụng theo sở thích của bạn" />

      <div className="space-y-6 max-w-2xl">
        <ProfileSection />
        <DisplaySection />
        <NotificationsSection />
        <SecuritySection />
        <DataSection />
      </div>
    </div>
  )
}

// ============================================================
// PROFILE SECTION
// ============================================================
function ProfileSection() {
  const [name, setName] = useState('Nguyễn Văn Anh')

  return (
    <SettingsCard title="Hồ sơ cá nhân" icon="👤">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-2xl font-bold text-white">
            A
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs hover:bg-indigo-500 transition-colors">
            ✏️
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-slate-500">Chủ hộ · Tham gia 03/2026</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Họ và tên</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
          <input
            type="email"
            value="nguyen.van.anh@gmail.com"
            readOnly
            className="input-field opacity-50 cursor-not-allowed"
          />
          <p className="text-[11px] text-slate-600 mt-1">Email không thể thay đổi trực tiếp</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-sm hover:bg-indigo-600/30 transition-colors">
          Lưu thay đổi
        </button>
      </div>
    </SettingsCard>
  )
}

// ============================================================
// DISPLAY SECTION
// ============================================================
function DisplaySection() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [currency, setCurrency] = useState('VND')
  const [language, setLanguage] = useState('vi')

  return (
    <SettingsCard title="Hiển thị" icon="🎨">
      <div className="space-y-4">
        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Giao diện</p>
            <p className="text-xs text-slate-600">Chọn chế độ sáng hoặc tối</p>
          </div>
          <div className="flex bg-white/[0.05] rounded-xl p-1 border border-white/[0.08]">
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${theme === 'dark' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              🌙 Tối
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${theme === 'light' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ☀️ Sáng
            </button>
          </div>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Language */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Ngôn ngữ</p>
            <p className="text-xs text-slate-600">Ngôn ngữ hiển thị</p>
          </div>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="select-field w-auto min-w-32"
          >
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Currency */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Đơn vị tiền tệ</p>
            <p className="text-xs text-slate-600">Đơn vị hiển thị số tiền</p>
          </div>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="select-field w-auto min-w-32"
          >
            <option value="VND">₫ VND</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
        </div>
      </div>
    </SettingsCard>
  )
}

// ============================================================
// NOTIFICATIONS SECTION
// ============================================================
function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    budgetAlert: true,
    paymentDue: true,
    goalProgress: true,
    weeklyReport: false,
    monthlyReport: true,
    familyActivity: false,
  })

  const toggle = (key: keyof typeof notifs) => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))

  const items = [
    { key: 'budgetAlert' as const, label: 'Cảnh báo vượt ngân sách', desc: 'Thông báo khi chi tiêu gần hoặc vượt hạn mức' },
    { key: 'paymentDue' as const, label: 'Nhắc nhở thanh toán', desc: 'Thẻ tín dụng, khoản nợ sắp đến hạn' },
    { key: 'goalProgress' as const, label: 'Tiến độ mục tiêu', desc: 'Cập nhật khi đạt các mốc tiết kiệm' },
    { key: 'weeklyReport' as const, label: 'Báo cáo hàng tuần', desc: 'Tóm tắt thu chi mỗi cuối tuần' },
    { key: 'monthlyReport' as const, label: 'Báo cáo hàng tháng', desc: 'Tổng kết tài chính đầu tháng' },
    { key: 'familyActivity' as const, label: 'Hoạt động gia đình', desc: 'Giao dịch mới từ các thành viên' },
  ]

  return (
    <SettingsCard title="Thông báo" icon="🔔">
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between py-1">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm text-slate-300">{item.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
            </div>
            <Toggle value={notifs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </SettingsCard>
  )
}

// ============================================================
// SECURITY SECTION
// ============================================================
function SecuritySection() {
  const [show2FAInfo, setShow2FAInfo] = useState(false)

  return (
    <SettingsCard title="Bảo mật" icon="🔐">
      <div className="space-y-3">
        {/* Change password */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-slate-300">Đổi mật khẩu</p>
            <p className="text-xs text-slate-600">Lần đổi gần nhất: 30 ngày trước</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 text-xs hover:bg-white/[0.08] transition-colors">
            Đổi ngay →
          </button>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* 2FA */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-slate-300">Xác thực 2 bước (2FA)</p>
            <p className="text-xs text-slate-600">Bảo vệ tài khoản với Google Authenticator</p>
          </div>
          <button
            onClick={() => setShow2FAInfo(!show2FAInfo)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-600/25 transition-colors"
          >
            Bật 2FA →
          </button>
        </div>

        {show2FAInfo && (
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-emerald-400/80">
              📱 Tính năng xác thực 2 bước sẽ ra mắt trong Phase 2, hỗ trợ Google Authenticator và SMS OTP.
            </p>
          </div>
        )}

        <div className="h-px bg-white/[0.06]" />

        {/* Active sessions */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-slate-300">Phiên đăng nhập</p>
            <p className="text-xs text-slate-600">1 thiết bị đang hoạt động</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 text-xs hover:bg-white/[0.08] transition-colors">
            Xem →
          </button>
        </div>
      </div>
    </SettingsCard>
  )
}

// ============================================================
// DATA SECTION
// ============================================================
function DataSection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <SettingsCard title="Dữ liệu" icon="💾">
      <div className="space-y-3">
        {/* Export */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-slate-300">Xuất dữ liệu CSV</p>
            <p className="text-xs text-slate-600">Tải toàn bộ giao dịch, ngân sách và báo cáo</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 text-xs hover:bg-indigo-600/25 transition-colors">
            ⬇️ Xuất CSV
          </button>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Backup */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-slate-300">Sao lưu dữ liệu</p>
            <p className="text-xs text-slate-600">Lần sao lưu gần nhất: hôm nay</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 text-xs hover:bg-white/[0.08] transition-colors">
            ☁️ Sao lưu
          </button>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Danger: Delete all */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-red-400">Xóa tất cả dữ liệu</p>
            <p className="text-xs text-slate-600">Xóa vĩnh viễn toàn bộ dữ liệu — không thể hoàn tác</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
          >
            🗑️ Xóa tất cả
          </button>
        </div>

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="mt-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400 font-semibold mb-1">⚠️ Xác nhận xóa toàn bộ dữ liệu?</p>
            <p className="text-xs text-slate-500 mb-3">Hành động này không thể hoàn tác. Tất cả giao dịch, ngân sách, mục tiêu và dữ liệu gia đình sẽ bị xóa vĩnh viễn.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-white/[0.06] text-slate-400 text-xs hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
              >
                Hủy
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30 transition-colors border border-red-500/30"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}
      </div>
    </SettingsCard>
  )
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function SettingsCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-indigo-600' : 'bg-white/[0.1]'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}
