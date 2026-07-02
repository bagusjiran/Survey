'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  generateSurveyAnonymousPDF,
  generateSurveyFullPDF,
  generateVoteAnonymousPDF,
  generateVoteFullPDF,
} from '@/lib/pdf-generator'

interface Agenda {
  id: string
  title: string
  description: string
  is_active: boolean
  event_date: string | null
  created_at: string
}

interface VoteCandidate {
  full_name: string
  nim: string
  vote_count: number
}

interface VoteDetail {
  voter: { full_name: string; nim: string }
  voted_for: { full_name: string; nim: string }
}

interface AgendaData {
  agenda: Agenda
  questions: any[]
  responses: any[]
  voteResults: VoteCandidate[]
  voteDetails: VoteDetail[]
  totalResponden: number
  totalVotes: number
}

export default function AdminDashboard() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [agendaData, setAgendaData] = useState<Record<string, AgendaData>>({})
  const [loading, setLoading] = useState(true)
  const [expandedAgenda, setExpandedAgenda] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'responses' | 'votes'>>({})
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const agendaRes = await fetch('/api/agendas')
        const agendaJson = await agendaRes.json()
        const allAgendas = agendaJson.agendas || []
        setAgendas(allAgendas)

        const dataMap: Record<string, AgendaData> = {}
        await Promise.all(
          allAgendas.map(async (agenda: Agenda) => {
            try {
              const [qRes, rRes, vRes, vdRes] = await Promise.all([
                fetch(`/api/questions?agendaId=${agenda.id}`).then((r) => r.json()),
                fetch(`/api/responses?agendaId=${agenda.id}`).then((r) => r.json()),
                fetch(`/api/votes?agendaId=${agenda.id}`).then((r) => r.json()),
                fetch(`/api/votes/detail?agendaId=${agenda.id}`).then((r) => r.json()),
              ])
              dataMap[agenda.id] = {
                agenda,
                questions: qRes.questions || [],
                responses: rRes.responses || [],
                voteResults: vRes.results || [],
                voteDetails: vdRes.votes || [],
                totalResponden: rRes.totalResponden || 0,
                totalVotes: vRes.totalVotes || 0,
              }
            } catch { /* skip */ }
          })
        )
        setAgendaData(dataMap)

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

  const handleExport = async (agendaId: string, type: 'survey-anon' | 'survey-full' | 'vote-anon' | 'vote-full') => {
    const data = agendaData[agendaId]
    if (!data) return

    setExporting(type)
    try {
      const title = data.agenda.title

      if (type === 'survey-anon') {
        generateSurveyAnonymousPDF(
          title,
          data.questions,
          data.responses,
          data.totalResponden
        )
      } else if (type === 'survey-full') {
        generateSurveyFullPDF(title, data.responses, data.totalResponden)
      } else if (type === 'vote-anon') {
        generateVoteAnonymousPDF(title, data.voteResults, data.totalVotes)
      } else if (type === 'vote-full') {
        generateVoteFullPDF(title, data.voteDetails, data.voteResults, data.totalVotes)
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('Gagal membuat PDF')
    } finally {
      setTimeout(() => setExporting(null), 500)
    }
  }

  const totalAgendas = agendas.length
  const totalResponses = Object.values(agendaData).reduce((s, d) => s + d.totalResponden, 0)
  const totalVotes = Object.values(agendaData).reduce((s, d) => s + d.totalVotes, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner !w-10 !h-10" />
        <p className="text-sm text-slate-400 mt-3">Memuat data...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin</h1>
        <p className="text-slate-500 mt-1">Kelola survey, lihat jawaban, hasil vote, dan cetak laporan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5 text-center hover-lift">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-100 flex items-center justify-center">
            <span className="text-lg">📅</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalAgendas}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Agenda</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center hover-lift">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-100 flex items-center justify-center">
            <span className="text-lg">💬</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalResponses}</p>
          <p className="text-xs text-slate-500 mt-0.5">Jawaban Survey</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center hover-lift">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center">
            <span className="text-lg">🏆</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalVotes}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Vote</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3 mb-8">
        <Link href="/admin/agenda" className="flex-1 glass rounded-xl p-4 text-center hover-lift transition-all">
          <p className="text-sm font-semibold text-slate-700">📅 Kelola Agenda</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Buat & atur agenda</p>
        </Link>
        <Link href="/admin/anggota" className="flex-1 glass rounded-xl p-4 text-center hover-lift transition-all">
          <p className="text-sm font-semibold text-slate-700">👥 Kelola Anggota</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lihat data anggota</p>
        </Link>
      </div>

      {/* All Agendas */}
      {agendas.length === 0 ? (
        <div className="glass rounded-2xl text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-medium">Belum ada agenda</p>
          <Link href="/admin/agenda" className="text-emerald-600 text-sm mt-2 inline-block hover:underline">
            + Buat agenda baru
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {agendas.map((agenda) => {
            const data = agendaData[agenda.id]
            if (!data) return null
            const isExpanded = expandedAgenda === agenda.id
            const currentTab = activeTab[agenda.id] || 'responses'

            return (
              <div key={agenda.id} className="glass rounded-2xl overflow-hidden animate-slide-up">
                {/* Agenda Header */}
                <button
                  onClick={() => toggleAgenda(agenda.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${agenda.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'}`} />
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{agenda.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">📋 {data.questions.length} pertanyaan</span>
                        <span className="flex items-center gap-1">💬 {data.totalResponden} jawaban</span>
                        <span className="flex items-center gap-1">🏆 {data.totalVotes} vote</span>
                      </div>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5">
                    {/* Tabs + PDF Export */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <button
                        onClick={() => setTab(agenda.id, 'responses')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          currentTab === 'responses'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        💬 Jawaban ({data.totalResponden})
                      </button>
                      <button
                        onClick={() => setTab(agenda.id, 'votes')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          currentTab === 'votes'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        🏆 Vote ({data.totalVotes})
                      </button>
                      <Link
                        href={`/admin/agenda/${agenda.id}`}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        ⚙️ Kelola
                      </Link>

                      {/* PDF Export Buttons */}
                      <div className="ml-auto flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleExport(agenda.id, 'survey-anon')}
                          disabled={exporting === 'survey-anon' || data.totalResponden === 0}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Download jawaban survey tanpa nama (anonim)"
                        >
                          {exporting === 'survey-anon' ? '⏳' : '📄'} Survey Anonim
                        </button>
                        <button
                          onClick={() => handleExport(agenda.id, 'survey-full')}
                          disabled={exporting === 'survey-full' || data.totalResponden === 0}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Download jawaban survey dengan nama lengkap"
                        >
                          {exporting === 'survey-full' ? '⏳' : '📋'} Survey Lengkap
                        </button>
                        <button
                          onClick={() => handleExport(agenda.id, 'vote-anon')}
                          disabled={exporting === 'vote-anon' || data.totalVotes === 0}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border border-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Download hasil vote tanpa detail siapa vote siapa"
                        >
                          {exporting === 'vote-anon' ? '⏳' : '🏆'} Vote Anonim
                        </button>
                        <button
                          onClick={() => handleExport(agenda.id, 'vote-full')}
                          disabled={exporting === 'vote-full' || data.totalVotes === 0}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Download detail lengkap siapa vote siapa"
                        >
                          {exporting === 'vote-full' ? '⏳' : '📊'} Vote Lengkap
                        </button>
                      </div>
                    </div>

                    {/* Responses Tab */}
                    {currentTab === 'responses' && (
                      <div>
                        {data.responses.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                            <p className="text-3xl mb-2">💬</p>
                            <p>Belum ada jawaban masuk</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                            {data.responses.map((entry: any, i: number) => (
                              <div key={i} className="bg-white/80 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                                    {entry.member.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700">{entry.member.full_name}</p>
                                    <p className="text-[11px] text-slate-400">NIM: {entry.member.nim}</p>
                                  </div>
                                </div>
                                <div className="space-y-2.5">
                                  {entry.answers.map((a: any) => (
                                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                      <p className="text-xs text-slate-500 font-medium sm:w-2/5 flex-shrink-0 pt-0.5">
                                        {a.question.question_text}
                                      </p>
                                      <div className="flex-1">
                                        {a.question.question_type === 'rating' ? (
                                          <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                              <svg key={s} className={`w-4 h-4 ${parseInt(a.response_text) >= s ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                              </svg>
                                            ))}
                                            <span className="text-[11px] text-slate-400 ml-1">{a.response_text}/5</span>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-1.5">
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
                      <div className="space-y-5">
                        {/* Vote Results Summary */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Perolehan Vote</h4>
                          {data.voteResults.length === 0 ? (
                            <p className="text-center text-slate-400 py-6">Belum ada vote</p>
                          ) : (
                            <div className="space-y-2.5">
                              {data.voteResults.map((v, i) => {
                                const pct = data.totalVotes > 0 ? (v.vote_count / data.totalVotes) * 100 : 0
                                const isWinner = i === 0
                                return (
                                  <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        {isWinner && <span className="text-base">🏆</span>}
                                        <span className="text-sm font-medium text-slate-700">{v.full_name}</span>
                                        <span className="text-[11px] text-slate-400">{v.nim}</span>
                                      </div>
                                      <span className="text-sm font-bold text-emerald-600">{v.vote_count} vote</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isWinner ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-300'}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Vote Details: Siapa Vote Siapa */}
                        {data.voteDetails.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Detail: Siapa Vote Siapa</h4>
                            <div className="bg-white/80 rounded-xl border border-slate-100 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-600">
                                    <th className="text-left px-4 py-2.5 font-semibold text-xs">#</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Pemilih</th>
                                    <th className="text-center px-4 py-2.5 font-semibold text-xs"></th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Dipilih</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.voteDetails.map((vd, i) => (
                                    <tr key={i} className="border-t border-slate-50 hover:bg-emerald-50/30 transition-colors">
                                      <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                                      <td className="px-4 py-2">
                                        <p className="font-medium text-slate-700">{vd.voter.full_name}</p>
                                        <p className="text-[10px] text-slate-400">{vd.voter.nim}</p>
                                      </td>
                                      <td className="px-4 py-2 text-center text-emerald-500 font-bold">→</td>
                                      <td className="px-4 py-2">
                                        <p className="font-medium text-slate-700">{vd.voted_for.full_name}</p>
                                        <p className="text-[10px] text-slate-400">{vd.voted_for.nim}</p>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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
