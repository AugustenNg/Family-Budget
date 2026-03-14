'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [familyName, setFamilyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Khong the tao gia dinh')
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Co loi xay ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-50">Chao mung, {session?.user?.name}!</h1>
          <p className="text-slate-400 mt-2">Tao gia dinh de bat dau quan ly tai chinh</p>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <form onSubmit={handleCreateFamily}>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ten gia dinh
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="VD: Gia dinh Nguyen Van A"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              autoFocus
            />

            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !familyName.trim()}
              className="w-full mt-6 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Dang tao...' : 'Tao gia dinh & Bat dau'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-sm text-slate-500 text-center">
              Sau khi tao, ban co the moi thanh vien gia dinh tham gia tu trang Quan ly gia dinh.
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Bo qua, dung thu ban demo truoc
          </button>
        </div>
      </div>
    </div>
  )
}
