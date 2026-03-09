'use client'

interface HeartbeatPulseProps {
  score: number        // 0-100
  income: number
  expense: number
  savings: number
}

export function HeartbeatPulse({ score, income, expense, savings }: HeartbeatPulseProps) {
  const { color, label, emoji } = getScoreInfo(score)

  const formatM = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
    return n.toLocaleString('vi-VN')
  }

  // SVG circle progress
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference
  const gap = circumference - dash

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      {/* Pulse rings */}
      <div className="relative flex items-center justify-center">
        {/* Ring 2 (outer) */}
        <div
          className="absolute rounded-full pulse-ring-2"
          style={{
            width: 200, height: 200,
            background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
            border: `1px solid ${color}15`,
          }}
        />
        {/* Ring 1 */}
        <div
          className="absolute rounded-full pulse-ring-1"
          style={{
            width: 172, height: 172,
            background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
            border: `1px solid ${color}25`,
          }}
        />

        {/* SVG Circle Progress */}
        <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={80} cy={80} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={8}
          />
          {/* Progress */}
          <circle
            cx={80} cy={80} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: 'stroke-dasharray 1s ease-out', filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl">{emoji}</span>
          <span className="font-num text-3xl font-bold text-white mt-0.5">{score}</span>
          <span className="text-xs font-medium" style={{ color }}>{label}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 w-full mt-1">
        <StatPill label="Thu nhập" value={`+${formatM(income)}`} color="#10b981" />
        <StatPill label="Chi tiêu" value={`-${formatM(expense)}`} color="#ef4444" />
        <StatPill label="Tiết kiệm" value={`+${formatM(savings)}`} color="#6366f1" />
      </div>

      <p className="text-[11px] text-slate-600 text-center">Điểm sức khỏe tháng 3/2026</p>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
      <span className="blur-sensitive font-num text-sm font-semibold" style={{ color }}>{value}</span>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  )
}

function getScoreInfo(score: number) {
  if (score >= 85) return { color: '#10b981', label: 'Xuất sắc', emoji: '🌟' }
  if (score >= 70) return { color: '#10b981', label: 'Tốt', emoji: '💚' }
  if (score >= 50) return { color: '#f59e0b', label: 'Trung bình', emoji: '🟡' }
  if (score >= 30) return { color: '#f97316', label: 'Yếu', emoji: '🟠' }
  return { color: '#ef4444', label: 'Nguy hiểm', emoji: '🔴' }
}
