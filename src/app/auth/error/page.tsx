'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const errorMessages: Record<string, string> = {
  Configuration: 'Co loi cau hinh server. Vui long lien he quan tri vien.',
  AccessDenied: 'Ban khong co quyen truy cap. Vui long lien he quan tri vien gia dinh.',
  Verification: 'Lien ket xac thuc da het han hoac da duoc su dung.',
  OAuthAccountNotLinked: 'Email nay da duoc su dung voi phuong thuc dang nhap khac.',
  Default: 'Co loi xay ra trong qua trinh xac thuc. Vui long thu lai.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-slate-50 mb-2">Loi xac thuc</h1>
        <p className="text-slate-400 mb-8">{message}</p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/signin"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
          >
            Thu lai
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-white/[0.06] text-slate-300 font-medium hover:bg-white/[0.1] transition-colors"
          >
            Ve trang chu
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
