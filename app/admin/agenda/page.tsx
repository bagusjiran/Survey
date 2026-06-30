'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Agenda {
  id: string
  title: string
  description: string
  event_date: string | null
  is_active: boolean
  created_at: string
}

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchAgendas = async () => {
    try {
      const res = await fetch('/api/agendas')
      const data = await res.json()
      setAgendas(data.agendas || [])
    } catch {
      showToast('Gagal memuat agenda', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAgendas() }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menambah agenda', 'error')
        return
      }
      showToast('Agenda berhasil dibuat!', 'success')
      setFormData({ title: '', description: '', event_date: '' })
      setShowForm(false)
      fetchAgendas()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/agendas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !current }),
      })
      if (!res.ok) {
        showToast('Gagal mengubah status', 'error')
        return
      }
      showToast(`Agenda ${!current ? 'diaktifkan' : 'dinonaktifkan'}`, 'success')
      fetchAgendas()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 toast-enter px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Agenda</h1>
          <p className="text-slate-500 mt-1">Buat dan kelola agenda kegiatan</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buat Agenda
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6 animate-slide-up">
          <h2 className="font-semibold text-slate-800 mb-4">Buat Agenda Baru</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <input
              type="text"
              placeholder="Judul Agenda (contoh: Kajian Rutin Bulanan)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
            />
            <textarea
              placeholder="Deskripsi (opsional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-600 font-medium hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
        </div>
      ) : agendas.length === 0 ? (
        <div className="glass rounded-2xl text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Belum ada agenda
        </div>
      ) : (
        <div className="grid gap-4">
          {agendas.map((agenda, i) => (
            <div
              key={agenda.id}
              className={`glass rounded-2xl p-6 hover-lift animate-slide-up stagger-${Math.min(i + 1, 5)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${agenda.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <h3 className="font-semibold text-slate-800">{agenda.title}</h3>
                  </div>
                  {agenda.description && (
                    <p className="text-sm text-slate-500 mb-2 ml-4">{agenda.description}</p>
                  )}
                  <p className="text-xs text-slate-400 ml-4">
                    {agenda.event_date
                      ? new Date(agenda.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Tanpa tanggal'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(agenda.id, agenda.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      agenda.is_active
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {agenda.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                  <Link
                    href={`/admin/agenda/${agenda.id}`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors"
                  >
                    Kelola →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
