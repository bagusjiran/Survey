'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Agenda {
  id: string
  title: string
  description: string
  event_date: string | null
  is_active: boolean
}

export default function SurveyListPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agendaRes, sessionRes] = await Promise.all([
          fetch('/api/agendas?active=true'),
          fetch('/api/auth/session'),
        ])
        const agendaData = await agendaRes.json()
        const sessionData = await sessionRes.json()
        setAgendas(agendaData.agendas || [])
        setUserName(sessionData.fullName || '')
      } catch {
        console.error('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen animated-bg islamic-pattern">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Survey UKM Kerohanian</h1>
                <p className="text-xs text-slate-500">Universitas Teknologi Ronggolawe</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">Halo, {userName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="glass rounded-2xl p-5 mb-6 animate-slide-up">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm text-slate-700 font-medium">Pilih agenda kegiatan untuk mengisi survey</p>
              <p className="text-xs text-slate-500 mt-1">Pilih mahasiswa teraktif dan berikan penilaian Anda</p>
            </div>
          </div>
        </div>

        {/* Agenda Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : agendas.length === 0 ? (
          <div className="glass rounded-2xl text-center py-16 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-slate-400 text-lg">Belum ada agenda aktif</p>
            <p className="text-slate-400 text-sm mt-1">Silakan hubungi admin untuk membuat agenda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendas.map((agenda, i) => (
              <button
                key={agenda.id}
                onClick={() => router.push(`/survey/${agenda.id}`)}
                className={`w-full text-left glass rounded-2xl p-6 hover-lift animate-slide-up stagger-${Math.min(i + 1, 5)} group cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                        {agenda.title}
                      </h3>
                    </div>
                    {agenda.description && (
                      <p className="text-sm text-slate-500 mb-2">{agenda.description}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {agenda.event_date
                        ? new Date(agenda.event_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Tanggal belum ditentukan'}
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
