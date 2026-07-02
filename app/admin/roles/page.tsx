'use client'

import { useState, useEffect } from 'react'

interface Member {
  id: string
  full_name: string
  nim: string
  is_admin: boolean
  role: string
}

const roleLabels: Record<string, { label: string; color: string; desc: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', desc: 'Akses penuh, kelola role anggota' },
  moderator: { label: 'Moderator', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', desc: 'Kelola agenda, pertanyaan, lihat data' },
  viewer: { label: 'Viewer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', desc: 'Hanya lihat data, tidak bisa edit' },
  member: { label: 'Anggota', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', desc: 'Isi survey dan vote' },
}

export default function RolesPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [currentRole, setCurrentRole] = useState('')

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members/roles')
      const data = await res.json()
      setMembers(data.members || [])
      // Get current user role
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      setCurrentRole(sessionData.role || 'member')
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setSaving(memberId)
    try {
      const res = await fetch('/api/members/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal mengubah role', 'error')
        return
      }
      showToast('Role berhasil diubah', 'success')
      fetchMembers()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner !w-10 !h-10" />
      </div>
    )
  }

  const isSuperAdmin = currentRole === 'super_admin'

  return (
    <div className="animate-fade-in">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toast?.message}
      </div>
      {toast && (
        <div role="alert" className={'fixed top-4 right-4 z-50 toast-enter px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ' +
          (toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500')}>
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kelola Role Anggota</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {isSuperAdmin ? 'Atur role dan hak akses setiap anggota' : 'Hanya super admin yang bisa mengubah role'}
        </p>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {Object.entries(roleLabels).map(([key, val]) => (
          <div key={key} className="glass rounded-xl p-3">
            <span className={'px-2 py-1 rounded-lg text-xs font-semibold ' + val.color}>{val.label}</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">{val.desc}</p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <th className="text-left px-4 py-3 font-semibold text-xs">Anggota</th>
                <th className="text-left px-4 py-3 font-semibold text-xs">NIM</th>
                <th className="text-left px-4 py-3 font-semibold text-xs">Role Saat Ini</th>
                <th className="text-left px-4 py-3 font-semibold text-xs">Ubah Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const roleInfo = roleLabels[m.role] || roleLabels.member
                return (
                  <tr key={m.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-xs flex items-center justify-center">
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{m.nim}</td>
                    <td className="px-4 py-3">
                      <span className={'px-2 py-1 rounded-lg text-xs font-semibold ' + roleInfo.color}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <select
                          value={m.role || 'member'}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          disabled={saving === m.id}
                          className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:border-emerald-400 transition-all disabled:opacity-50"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="viewer">Viewer</option>
                          <option value="member">Anggota</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
