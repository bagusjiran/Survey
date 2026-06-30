'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Agenda {
  id: string
  title: string
  description: string
  is_active: boolean
  event_date: string | null
  created_at: string
}

interface AgendaData {
  agenda: Agenda
  questions: any[]
  responses: any[]
  voteResults: any[]
  totalResponden: number
  totalVotes: number
}

export default function AdminDashboard() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [agendaData, setAgendaData] = useState<Record<string, AgendaData>>({})
  const [loading, setLoading] = useState(true)
  const [expandedAgenda, setExpandedAgenda] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'responses' | 'votes'>>({})

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch all agendas
        const agendaRes = await fetch('/api/agendas')
        const agendaJson = await agendaRes.json()
        const allAgendas = agendaJson.agendas || []
        setAgendas(allAgendas)

        // Fetch data for each agenda in parallel
        const dataMap: Record<string, AgendaData> = {}
        await Promise.all(
          allAgendas.map(async (agenda: Agenda) => {
            try {
              const [qRes, rRes, vRes] = await Promise.all([
                fetch(`/api/questions?agendaId=${agenda.id}`).then((r) => r.json()),
                fetch(`/api/responses?agendaId=${agenda.id}`).then((r) => r.json()),
                fetch(`/api/votes?agendaId=${agenda.id}`).then((r) => r.json()),
              ])
              dataMap[agenda.id] = {
                agenda,
                questions: qRes.questions || [],
                responses: rRes.responses || [],
                voteResults: vRes.results || [],
                totalResponden: rRes.totalResponden || 0,
                totalVotes: vRes.totalVotes || 0,
              }
            } catch { /* skip */ }
          })
        )
        setAgendaData(dataMap)

        // Auto-expand first agenda
        if (allAgendas.length > 0) {
          setExpandedAgenda(allAgendas[0].id)
          setActiveTab({ [allAgendas[0].id]: 'responses' })
        }
      } catch {
        console.error('Failed to fetch')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const toggleAgenda = (id: string) => {
    setExpandedAgenda(expandedAgenda === id ? null : id)
    if (!activeTab[id]) {
      setActiveTab((prev) => ({ ...prev, [id]: 'responses' }))
    }
  }

  const setTab = (agendaId: string, tab: 'responses' | 'votes') => {
    setActiveTab((prev) => ({ ...prev, [agendaId]: tab }))
  }

  const totalAgendas = agendas.length
  const totalResponses = Object.values(agendaData).reduce((s, d) => s + d.totalResponden, 0)
  const totalVotes = Object.values(agendaData).reduce((s, d) => s + d.totalVotes, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner !w-10 !h-10" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin</h1>
        <p className="text-slate-500 mt-1">Kelola survey, lihat jawaban dan hasil vote</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{totalAgendas}</p>
          <p className="text-xs text-slate-500">Agenda</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalResponses}</p>
          <p className="text-xs text-slate-500">Jawaban</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalVotes}</p>
          <p className="text-xs text-slate-500">Vote</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2 mb-6">
        <Link href="/admin/anggota" className="flex-1 glass rounded-xl p-3 text-center hover-lift">
          <p className="text-sm font-medium text-slate-700">👥 Anggota</p>
        </Link>
        <Link href="/admin/agenda" className="flex-1 glass rounded-xl p-3 text-center hover-lift">
          <p className="text-sm font-medium text-slate-700">📅 Kelola Agenda</p>
        </Link>
      </div>

      {/* All Agendas with Responses */}
      {agendas.length === 0 ? (
        <div className="glass rounded-2xl text-center py-12 text-slate-400">
          <p className="text-lg">Belum ada agenda</p>
          <Link href="/admin/agenda" className="text-emerald-600 text-sm mt-2 inline-block hover:underline">
            + Buat agenda baru
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {agendas.map((agenda) => {
            const data = agendaData[agenda.id]
            if (!data) return null
            const isExpanded = expandedAgenda === agenda.id
            const currentTab = activeTab[agenda.id] || 'responses'

            return (
              <div key={agenda.id} className="glass rounded-2xl overflow-hidden animate-slide-up">
                {/* Agenda Header — clickable */}
                <button
                  onClick={() => toggleAgenda(agenda.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${agenda.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <div>
                      <h3 className="font-semibold text-slate-800">{agenda.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>📋 {data.questions.length} pertanyaan</span>
                        <span>💬 {data.totalResponden} jawaban</span>
                        <span>🏆 {data.totalVotes} vote</span>
                      </div>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4">
                    {/* Tab Switch */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setTab(agenda.id, 'responses')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentTab === 'responses'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        💬 Jawaban ({data.totalResponden})
                      </button>
                      <button
                        onClick={() => setTab(agenda.id, 'votes')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentTab === 'votes'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🏆 Vote ({data.totalVotes})
                      </button>
                      <Link
                        href={`/admin/agenda/${agenda.id}`}
                        className="ml-auto px-3 py-2 rounded-lg text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        Kelola →
                      </Link>
                    </div>

                    {/* Responses Tab */}
                    {currentTab === 'responses' && (
                      <div>
                        {data.responses.length === 0 ? (
                          <p className="text-center text-slate-400 py-6">Belum ada jawaban</p>
                        ) : (
                          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {data.responses.map((entry: any, i: number) => (
                              <div key={i} className="bg-slate-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                    {entry.member.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700">{entry.member.full_name}</p>
                                    <p className="text-[10px] text-slate-400">{entry.member.nim}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {entry.answers.map((a: any) => (
                                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                                      <p className="text-xs text-slate-500 font-medium sm:w-2/5 flex-shrink-0">
                                        {a.question.question_text}
                                      </p>
                                      <div className="flex-1">
                                        {a.question.question_type === 'rating' ? (
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                              <svg key={s} className={`w-4 h-4 ${parseInt(a.response_text) >= s ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                              </svg>
                                            ))}
                                            <span className="text-[10px] text-slate-400 ml-1">{a.response_text}/5</span>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-700 bg-white rounded px-2 py-1">
                                            {a.response_text || <span className="text-slate-400 italic">-</span>}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Votes Tab */}
                    {currentTab === 'votes' && (
                      <div>
                        {data.voteResults.length === 0 ? (
                          <p className="text-center text-slate-400 py-6">Belum ada vote</p>
                        ) : (
                          <div className="space-y-2.5">
                            {data.voteResults.map((v: any, i: number) => {
                              const pct = data.totalVotes > 0 ? (v.vote_count / data.totalVotes) * 100 : 0
                              const isWinner = i === 0
                              return (
                                <div key={v.voted_for_id}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      {isWinner && <span>🏆</span>}
                                      <span className="text-sm font-medium text-slate-700">{v.full_name}</span>
                                      <span className="text-[10px] text-slate-400">{v.nim}</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">{v.vote_count}</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${isWinner ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
