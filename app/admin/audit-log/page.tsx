'use client'

import { useState, useEffect } from 'react'

interface AuditLog {
  id: string
  user_name: string
  action: string
  details: string
  created_at: string
}

const actionLabels: Record<string, { label: string; color: string }> = {
  login: { label: 'Login', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  logout: { label: 'Logout', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  create_agenda: { label: 'Buat Agenda', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  update_agenda: { label: 'Update Agenda', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  create_question: { label: 'Buat Pertanyaan', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  update_question: { label: 'Update Pertanyaan', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  delete_question: { label: 'Hapus Pertanyaan', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  submit_survey: { label: 'Isi Survey', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  submit_vote: { label: 'Vote', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  export_pdf: { label: 'Export PDF', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  export_excel: { label: 'Export Excel', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/audit-logs?limit=100')
        const data = await res.json()
        setLogs(data.logs || [])
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Baru saja'
    if (mins < 60) return mins + ' menit lalu'
    const hours = Math.floor(mins / 60)
    if (hours < 24) return hours + ' jam lalu'
    const days = Math.floor(hours / 24)
    return days + ' hari lalu'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner !w-10 !h-10" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Audit Log</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Riwayat semua aktivitas dalam sistem</p>
      </div>

      {logs.length === 0 ? (
        <div className="glass rounded-2xl text-center py-16 text-slate-400">
          <i className="bi bi-shield-check text-4xl mb-3 block" />
          <p>Belum ada aktivitas tercatat</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                  <th className="text-left px-4 py-3 font-semibold text-xs">Waktu</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Aksi</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const actionInfo = actionLabels[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={log.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{getTimeAgo(log.created_at)}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{log.user_name}</td>
                      <td className="px-4 py-3">
                        <span className={'px-2 py-1 rounded-lg text-xs font-medium ' + actionInfo.color}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{log.details}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
