import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" style={{ zIndex: 0 }} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        className="flex-1 relative z-10 min-h-screen overflow-x-hidden"
        style={{ marginLeft: 220 }}
      >
        <div className="max-w-[1400px] mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
