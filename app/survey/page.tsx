'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Agenda {
  id: string
  title: string
  description: string
  event_date: string | null
  is_active: boolean
}

interface VoteResult {
  full_name: string
  nim: string
  vote_count: number
}

interface SessionData {
  memberId: string
  fullName: string
  nim: string
  isAdmin: boolean
}

export default function SurveyListPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionData | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [agendaVotes, setAgendaVotes] = useState<Record<string, VoteResult[]>>({})
  const [loggingOut, setLoggingOut] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
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
        setSession(sessionData)

        // Fetch vote results for each agenda
        const votesMap: Record<string, VoteResult[]> = {}
        await Promise.all(
          (agendaData.agendas || []).map(async (a: Agenda) => {
            try {
              const res = await fetch(`/api/votes?agendaId=${a.id}`)
              const data = await res.json()
              votesMap[a.id] = data.results || []
            } catch { /* ignore */ }
          })
        )
        setAgendaVotes(votesMap)
      } catch {
        console.error('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Close profile menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen animated-bg islamic-pattern">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Survey UKM Kerohanian</h1>
              <p className="text-[10px] text-slate-400">UTR Cepu</p>
            </div>
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                {session?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{session?.fullName || '...'}</p>
                {session?.isAdmin && (
                  <p className="text-[10px] text-emerald-600 font-medium">Admin</p>
                )}
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl shadow-xl border border-slate-200/50 py-2 z-50 animate-scale-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-medium text-slate-800 text-sm">{session?.fullName}</p>
                  <p className="text-xs text-slate-400">NIM: {session?.nim}</p>
                </div>

                {session?.isAdmin && (
                  <button
                    onClick={() => { router.push('/admin'); setShowProfile(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    Dashboard Admin
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  {loggingOut ? 'Keluar...' : 'Keluar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Agenda Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner !w-10 !h-10" />
          </div>
        ) : agendas.length === 0 ? (
          <div className="glass rounded-2xl text-center py-16 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-slate-400 text-lg">Belum ada agenda aktif</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendas.map((agenda, i) => {
              const votes = agendaVotes[agenda.id] || []
              const topVote = votes[0]
              return (
                <div
                  key={agenda.id}
                  className={`glass rounded-2xl p-5 hover-lift animate-slide-up stagger-${Math.min(i + 1, 5)} cursor-pointer`}
                  onClick={() => router.push(`/survey/${agenda.id}`)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-base font-semibold text-slate-800">{agenda.title}</h3>
                      </div>
                      {agenda.description && (
                        <p className="text-sm text-slate-500 ml-4">{agenda.description}</p>
                      )}
                      <p className="text-xs text-slate-400 ml-4 mt-1">
                        {agenda.event_date
                          ? new Date(agenda.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Tanggal belum ditentukan'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>

                  {/* Vote Results Preview */}
                  {votes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">🏆</span>
                        <p className="text-xs font-medium text-slate-500">Mahasiswa Teraktif</p>
                      </div>
                      <div className="space-y-1.5">
                        {votes.slice(0, 3).map((v, j) => {
                          const maxV = votes[0].vote_count
                          const pct = maxV > 0 ? (v.vote_count / maxV) * 100 : 0
                          return (
                            <div key={j} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-4">{j + 1}.</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-medium text-slate-700 truncate">{v.full_name}</span>
                                  <span className="text-xs text-emerald-600 font-bold ml-2">{v.vote_count}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${j === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
