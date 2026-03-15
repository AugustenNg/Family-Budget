'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  isSystemAdmin: boolean
  createdAt: string
  familyMemberships: {
    id: string
    role: string
    status: string
    family: { id: string; name: string }
  }[]
}

interface Family {
  id: string
  name: string
  currency: string
  createdAt: string
  _count: { members: number }
}

interface Stats {
  users: number
  families: number
  transactions: number
  accounts: number
}

type ModalType = 'create-user' | 'edit-user' | 'change-password' | 'assign-family' | 'create-family' | null

export default function AdminPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tab, setTab] = useState<'users' | 'families'>('users')

  // Form states
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', isSystemAdmin: false })
  const [pwForm, setPwForm] = useState({ password: '' })
  const [familyForm, setFamilyForm] = useState({ name: '', ownerUserId: '' })
  const [assignForm, setAssignForm] = useState({ familyId: '', role: 'MEMBER' as string })

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, familiesRes, statsRes] = await Promise.all([
        fetch('/api/v1/admin/users'),
        fetch('/api/v1/admin/families'),
        fetch('/api/v1/admin/stats'),
      ])

      if (usersRes.status === 403) {
        setError('Ban khong co quyen admin')
        setLoading(false)
        return
      }

      const [usersData, familiesData, statsData] = await Promise.all([
        usersRes.json(),
        familiesRes.json(),
        statsRes.json(),
      ])

      setUsers(usersData.data || [])
      setFamilies(familiesData.data || [])
      setStats(statsData.data || null)
    } catch {
      setError('Khong the tai du lieu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      showMessage(`Da tao user: ${data.data.email}`)
      setModal(null)
      setForm({ email: '', password: '', name: '', phone: '', isSystemAdmin: false })
      fetchData()
    } catch (err: any) {
      showMessage(err.message || 'Loi tao user', true)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          isSystemAdmin: form.isSystemAdmin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      showMessage('Da cap nhat user')
      setModal(null)
      fetchData()
    } catch (err: any) {
      showMessage(err.message || 'Loi cap nhat', true)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', password: pwForm.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      showMessage('Da doi mat khau')
      setModal(null)
      setPwForm({ password: '' })
    } catch (err: any) {
      showMessage(err.message || 'Loi doi mat khau', true)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Xoa user "${user.name}" (${user.email})? Khong the hoan tac!`)) return
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      showMessage('Da xoa user')
      fetchData()
    } catch (err: any) {
      showMessage(err.message || 'Loi xoa user', true)
    }
  }

  const handleAssignFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign-family', ...assignForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      showMessage('Da gan gia dinh')
      setModal(null)
      fetchData()
    } catch (err: any) {
      showMessage(err.message || 'Loi gan gia dinh', true)
    }
  }

  const handleRemoveFromFamily = async (userId: string, familyId: string) => {
    if (!confirm('Xoa user khoi gia dinh nay?')) return
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-family', familyId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      showMessage('Da xoa khoi gia dinh')
      fetchData()
    } catch (err: any) {
      showMessage(err.message || 'Loi', true)
    }
  }

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/admin/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      showMessage(`Da tao gia dinh: ${data.data.name}`)
      setModal(null)
      setFamilyForm({ name: '', ownerUserId: '' })
      fetchData()
    } catch (err: any) {
      showMessage(err.message || 'Loi tao gia dinh', true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error === 'Ban khong co quyen admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">&#128274;</div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">Truy cap bi tu choi</h2>
          <p className="text-slate-400">Ban khong co quyen System Admin</p>
        </div>
      </div>
    )
  }

  const roleColors: Record<string, string> = {
    OWNER: 'bg-amber-500/20 text-amber-400',
    ADMIN: 'bg-indigo-500/20 text-indigo-400',
    MEMBER: 'bg-emerald-500/20 text-emerald-400',
    CHILD: 'bg-slate-500/20 text-slate-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Quan tri he thong</h1>
          <p className="text-slate-400 text-sm mt-1">Quan ly tai khoan, phan quyen va gia dinh</p>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Users', value: stats.users, color: 'text-indigo-400' },
            { label: 'Gia dinh', value: stats.families, color: 'text-emerald-400' },
            { label: 'Giao dich', value: stats.transactions, color: 'text-amber-400' },
            { label: 'Tai khoan', value: stats.accounts, color: 'text-sky-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-2">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'users' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab('families')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'families' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Gia dinh ({families.length})
        </button>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setForm({ email: '', password: '', name: '', phone: '', isSystemAdmin: false }); setModal('create-user') }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              + Tao user moi
            </button>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase hidden md:table-cell">Gia dinh</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase hidden md:table-cell">Vai tro</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-medium">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                            {user.name}
                            {user.isSystemAdmin && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400 font-medium">ADMIN</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.familyMemberships.length === 0 && (
                          <span className="text-xs text-slate-600">Chua co</span>
                        )}
                        {user.familyMemberships.map((m) => (
                          <span key={m.id} className="flex items-center gap-1">
                            <span className="text-xs text-slate-300">{m.family.name}</span>
                            <button
                              onClick={() => handleRemoveFromFamily(user.id, m.family.id)}
                              className="text-red-500/50 hover:text-red-400 text-xs"
                              title="Xoa khoi gia dinh"
                            >x</button>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.familyMemberships.map((m) => (
                          <span key={m.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${roleColors[m.role] || ''}`}>
                            {m.role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setForm({ email: user.email, name: user.name, phone: user.phone || '', password: '', isSystemAdmin: user.isSystemAdmin })
                            setModal('edit-user')
                          }}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded transition-colors"
                        >Sua</button>
                        <button
                          onClick={() => { setSelectedUser(user); setPwForm({ password: '' }); setModal('change-password') }}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded transition-colors"
                        >MK</button>
                        <button
                          onClick={() => { setSelectedUser(user); setAssignForm({ familyId: families[0]?.id || '', role: 'MEMBER' }); setModal('assign-family') }}
                          className="px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
                        >+GD</button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >Xoa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Families Tab */}
      {tab === 'families' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setFamilyForm({ name: '', ownerUserId: '' }); setModal('create-family') }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              + Tao gia dinh moi
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {families.map((f) => (
              <div key={f.id} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-200">{f.name}</h3>
                  <span className="text-xs text-slate-500">{f.currency}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span>{f._count.members} thanh vien</span>
                  <span>Tao: {new Date(f.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-600 font-mono">ID: {f.id}</p>
              </div>
            ))}
            {families.length === 0 && (
              <p className="text-slate-500 text-sm col-span-2 text-center py-8">Chua co gia dinh nao</p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-slate-900 border border-white/[0.1] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>

            {/* Create User Modal */}
            {modal === 'create-user' && (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-50">Tao user moi</h3>
                <input type="text" placeholder="Ho ten" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <input type="password" placeholder="Mat khau (min 6 ky tu)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <input type="text" placeholder="SDT (tuy chon)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={form.isSystemAdmin} onChange={(e) => setForm({ ...form, isSystemAdmin: e.target.checked })}
                    className="rounded border-white/20" />
                  System Admin
                </label>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Huy</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">Tao</button>
                </div>
              </form>
            )}

            {/* Edit User Modal */}
            {modal === 'edit-user' && selectedUser && (
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-50">Sua user: {selectedUser.name}</h3>
                <input type="text" placeholder="Ho ten" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <input type="text" placeholder="SDT" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={form.isSystemAdmin} onChange={(e) => setForm({ ...form, isSystemAdmin: e.target.checked })}
                    className="rounded border-white/20" />
                  System Admin
                </label>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Huy</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">Luu</button>
                </div>
              </form>
            )}

            {/* Change Password Modal */}
            {modal === 'change-password' && selectedUser && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-50">Doi mat khau: {selectedUser.name}</h3>
                <input type="password" placeholder="Mat khau moi (min 6 ky tu)" value={pwForm.password} onChange={(e) => setPwForm({ password: e.target.value })} required minLength={6}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Huy</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">Doi mat khau</button>
                </div>
              </form>
            )}

            {/* Assign Family Modal */}
            {modal === 'assign-family' && selectedUser && (
              <form onSubmit={handleAssignFamily} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-50">Gan gia dinh: {selectedUser.name}</h3>
                <select value={assignForm.familyId} onChange={(e) => setAssignForm({ ...assignForm, familyId: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 text-sm focus:outline-none focus:border-emerald-500/50">
                  <option value="">Chon gia dinh</option>
                  {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <select value={assignForm.role} onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 text-sm focus:outline-none focus:border-emerald-500/50">
                  <option value="OWNER">OWNER (Chu ho)</option>
                  <option value="ADMIN">ADMIN (Quan tri)</option>
                  <option value="MEMBER">MEMBER (Thanh vien)</option>
                  <option value="CHILD">CHILD (Con cai)</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Huy</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600">Gan</button>
                </div>
              </form>
            )}

            {/* Create Family Modal */}
            {modal === 'create-family' && (
              <form onSubmit={handleCreateFamily} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-50">Tao gia dinh moi</h3>
                <input type="text" placeholder="Ten gia dinh" value={familyForm.name} onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
                <select value={familyForm.ownerUserId} onChange={(e) => setFamilyForm({ ...familyForm, ownerUserId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-50 text-sm focus:outline-none focus:border-emerald-500/50">
                  <option value="">Chu ho (tuy chon)</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Huy</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">Tao</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
