'use client'

import { useState, useEffect } from 'react'

interface Member {
  id: string
  full_name: string
  nim: string
  is_admin: boolean
  created_at: string
}

export default function AnggotaPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', nim: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members')
      const data = await res.json()
      setMembers(data.members || [])
    } catch {
      showToast('Gagal memuat data anggota', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menambah anggota', 'error')
        return
      }
      showToast('Anggota berhasil ditambahkan!', 'success')
      setFormData({ fullName: '', nim: '' })
      setShowForm(false)
      fetchMembers()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Gagal menghapus', 'error')
        return
      }
      showToast('Anggota berhasil dihapus', 'success')
      setDeleteConfirm(null)
      fetchMembers()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const filtered = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.nim.includes(search)
  )

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 toast-enter px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Anggota</h1>
          <p className="text-slate-500 mt-1">Total {members.length} anggota terdaftar</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Anggota
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6 animate-slide-up">
          <h2 className="font-semibold text-slate-800 mb-4">Tambah Anggota Baru</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
            />
            <input
              type="text"
              placeholder="NIM"
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              required
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama atau NIM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
        />
      </div>

      {/* Members Table */}
      <div className="glass rounded-2xl overflow-hidden animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            {search ? 'Tidak ditemukan' : 'Belum ada anggota'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/60">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">No</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NIM</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, i) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{member.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.nim}</td>
                    <td className="px-6 py-4">
                      {member.is_admin ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Admin</span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Anggota</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!member.is_admin && (
                        <>
                          {deleteConfirm === member.id ? (
                            <div className="flex items-center justify-end gap-2 animate-scale-in">
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                Hapus
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(member.id)}
                              className="text-sm text-red-500 hover:text-red-700 transition-colors"
                            >
                              Hapus
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
