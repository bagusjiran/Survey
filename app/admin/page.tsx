'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatCard from '@/components/StatCard'
import BarChart from '@/components/charts/BarChart'
import PieChart from '@/components/charts/PieChart'
import { SkeletonList } from '@/components/SkeletonLoader'
import {
  generateSurveyAnonymousPDF,
  generateSurveyFullPDF,
  generateVoteAnonymousPDF,
  generateVoteFullPDF,
} from '@/lib/pdf-generator'
import { exportToExcel, exportToCSV } from '@/lib/export-excel'

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
  const [activeTab, setActiveTab] = useState<Record<string, 'responses' | 'votes' | 'charts'>>({})
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
                fetch('/api/questions?agendaId=' + agenda.id).then(r => r.json()),
                fetch('/api/responses?agendaId=' + agenda.id).then(r => r.json()),
                fetch('/api/votes?agendaId=' + agenda.id).then(r => r.json()),
                fetch('/api/votes/detail?agendaId=' + agenda.id).then(r => r.json()),
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
          setActiveTab({ [allAgendas[0].id]: 'charts' })
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
    if (!activeTab[id]) setActiveTab(prev => ({ ...prev, [id]: 'charts' }))
  }

  const setTab = (agendaId: string, tab: 'responses' | 'votes' | 'charts') => {
    setActiveTab(prev => ({ ...prev, [agendaId]: tab }))
  }

  // PDF Export
  const handleExportPDF = async (agendaId: string, type: 'survey-anon' | 'survey-full' | 'vote-anon' | 'vote-full') => {
    const data = agendaData[agendaId]
    if (!data) return
    const key = agendaId + '-pdf-' + type
    setExporting(key)
    try {
      const title = data.agenda.title
      if (type === 'survey-anon') await generateSurveyAnonymousPDF(agendaId, title)
      else if (type === 'survey-full') generateSurveyFullPDF(title, data.responses, data.totalResponden)
      else if (type === 'vote-anon') generateVoteAnonymousPDF(title, data.voteResults, data.totalVotes)
      else if (type === 'vote-full') generateVoteFullPDF(title, data.voteDetails, data.voteResults, data.totalVotes)
    } catch (err) {
      console.error('Export error:', err)
      alert('Gagal membuat PDF')
    } finally {
      setTimeout(() => setExporting(null), 500)
    }
  }

  // Excel/CSV Export
  const handleExportData = async (agendaId: string, format: 'excel' | 'csv', type: 'survey' | 'votes') => {
    const data = agendaData[agendaId]
    if (!data) return
    const key = agendaId + '-' + format + '-' + type
    setExporting(key)
    try {
      const res = await fetch('/api/export?agendaId=' + agendaId + '&type=' + type)
      const result = await res.json()
      const rows = result.data || []
      const filename = type + '-' + data.agenda.title.replace(/\s+/g, '-').toLowerCase()

      if (type === 'survey') {
        const cols = [
          { header: 'Nama', key: 'nama', width: 25 },
          { header: 'NIM', key: 'nim', width: 15 },
          { header: 'Pertanyaan', key: 'pertanyaan', width: 40 },
          { header: 'Jawaban', key: 'jawaban', width: 40 },
          { header: 'Waktu', key: 'waktu', width: 20 },
        ]
        if (format === 'excel') exportToExcel(rows, cols, filename)
        else exportToCSV(rows, cols, filename)
      } else {
        const cols = [
          { header: 'Pemilih', key: 'pemilih', width: 25 },
          { header: 'NIM Pemilih', key: 'nim_pemilih', width: 15 },
          { header: 'Dipilih', key: 'dipilih', width: 25 },
          { header: 'NIM Dipilih', key: 'nim_dipilih', width: 15 },
          { header: 'Waktu', key: 'waktu', width: 20 },
        ]
        if (format === 'excel') exportToExcel(rows, cols, filename)
        else exportToCSV(rows, cols, filename)
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('Gagal export data')
    } finally {
      setTimeout(() => setExporting(null), 500)
    }
  }

  const totalAgendas = agendas.length
  const totalResponses = Object.values(agendaData).reduce((s, d) => s + d.totalResponden, 0)
  const totalVotes = Object.values(agendaData).reduce((s, d) => s + d.totalVotes, 0)

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Admin</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola survey, lihat analitik, dan export data</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Agenda" value={totalAgendas} icon="bi-calendar3" color="blue" />
        <StatCard label="Jawaban Survey" value={totalResponses} icon="bi-chat-dots" color="emerald" />
        <StatCard label="Total Vote" value={totalVotes} icon="bi-star" color="amber" />
      </div>

      {/* Quick Links */}
      <div className="flex gap-3 mb-8">
        <Link href="/admin/agenda" className="flex-1 glass rounded-xl p-4 text-center hover-lift transition-all">
          <i className="bi bi-calendar3 text-lg text-blue-500 mb-1 block" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kelola Agenda</p>
        </Link>
        <Link href="/admin/anggota" className="flex-1 glass rounded-xl p-4 text-center hover-lift transition-all">
          <i className="bi bi-people text-lg text-emerald-500 mb-1 block" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kelola Anggota</p>
        </Link>
        <Link href="/admin/audit-log" className="flex-1 glass rounded-xl p-4 text-center hover-lift transition-all">
          <i className="bi bi-shield-check text-lg text-violet-500 mb-1 block" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Audit Log</p>
        </Link>
      </div>

      {/* Agendas */}
      {agendas.length === 0 ? (
        <div className="glass rounded-2xl text-center py-16 text-slate-400">
          <i className="bi bi-inbox text-4xl mb-3 block" />
          <p className="text-lg font-medium">Belum ada agenda</p>
          <Link href="/admin/agenda" className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 inline-block hover:underline">
            + Buat agenda baru
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {agendas.map(agenda => {
            const data = agendaData[agenda.id]
            if (!data) return null
            const isExpanded = expandedAgenda === agenda.id
            const currentTab = activeTab[agenda.id] || 'charts'

            return (
              <div key={agenda.id} className="glass rounded-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <button onClick={() => toggleAgenda(agenda.id)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <div className={'w-3 h-3 rounded-full ' + (agenda.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300')} />
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{agenda.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mt-1">
                        <span><i className="bi bi-list-check mr-1" />{data.questions.length} pertanyaan</span>
                        <span><i className="bi bi-chat-dots mr-1" />{data.totalResponden} jawaban</span>
                        <span><i className="bi bi-star mr-1" />{data.totalVotes} vote</span>
                      </div>
                    </div>
                  </div>
                  <i className={'bi bi-chevron-down text-slate-400 transition-transform duration-300 ' + (isExpanded ? 'rotate-180' : '')} />
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700 p-5">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      {(['charts', 'responses', 'votes'] as const).map(tab => (
                        <button key={tab} onClick={() => setTab(agenda.id, tab)}
                          className={'px-4 py-2 rounded-xl text-sm font-medium transition-all ' +
                            (currentTab === tab
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600')}>
                          {tab === 'charts' && <><i className="bi bi-bar-chart mr-1" />Analitik</>}
                          {tab === 'responses' && <><i className="bi bi-chat-dots mr-1" />Jawaban ({data.totalResponden})</>}
                          {tab === 'votes' && <><i className="bi bi-star mr-1" />Vote ({data.totalVotes})</>}
                        </button>
                      ))}
                      <Link href={'/admin/agenda/' + agenda.id} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800">
                        <i className="bi bi-gear mr-1" />Kelola
                      </Link>

                      {/* Export Buttons */}
                      <div className="ml-auto flex flex-wrap gap-1.5">
                        <div className="relative group">
                          <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-800">
                            <i className="bi bi-file-pdf mr-1" />PDF
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-10 hidden group-hover:block">
                            <button onClick={() => handleExportPDF(agenda.id, 'survey-anon')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-xl">Survey Anonim</button>
                            <button onClick={() => handleExportPDF(agenda.id, 'survey-full')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700">Survey Lengkap</button>
                            <button onClick={() => handleExportPDF(agenda.id, 'vote-anon')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700">Vote Anonim</button>
                            <button onClick={() => handleExportPDF(agenda.id, 'vote-full')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-xl">Vote Lengkap</button>
                          </div>
                        </div>
                        <div className="relative group">
                          <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors border border-green-200 dark:border-green-800">
                            <i className="bi bi-file-earmark-excel mr-1" />Excel
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-10 hidden group-hover:block">
                            <button onClick={() => handleExportData(agenda.id, 'excel', 'survey')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-xl">Survey</button>
                            <button onClick={() => handleExportData(agenda.id, 'excel', 'votes')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-xl">Vote</button>
                          </div>
                        </div>
                        <div className="relative group">
                          <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600">
                            <i className="bi bi-filetype-csv mr-1" />CSV
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-10 hidden group-hover:block">
                            <button onClick={() => handleExportData(agenda.id, 'csv', 'survey')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-xl">Survey</button>
                            <button onClick={() => handleExportData(agenda.id, 'csv', 'votes')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-xl">Vote</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charts Tab */}
                    {currentTab === 'charts' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Vote Chart */}
                        {data.voteResults.length > 0 && (
                          <div className="glass rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Perolehan Vote</h4>
                            <BarChart
                              labels={data.voteResults.map(v => v.full_name.split(' ')[0])}
                              data={data.voteResults.map(v => v.vote_count)}
                            />
                          </div>
                        )}
                        {/* Vote Pie */}
                        {data.voteResults.length > 0 && (
                          <div className="glass rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribusi Vote</h4>
                            <PieChart
                              labels={data.voteResults.map(v => v.full_name.split(' ')[0])}
                              data={data.voteResults.map(v => v.vote_count)}
                              doughnut
                            />
                          </div>
                        )}
                        {/* Participation */}
                        <div className="glass rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Partisipasi</h4>
                          <PieChart
                            labels={['Sudah Mengisi', 'Belum Mengisi']}
                            data={[data.totalResponden, Math.max(0, 23 - data.totalResponden)]}
                            doughnut
                          />
                        </div>
                        {/* Rating Distribution */}
                        {data.responses.length > 0 && (() => {
                          const ratings = data.responses.flatMap((r: any) =>
                            r.answers.filter((a: any) => a.question.question_type === 'rating')
                              .map((a: any) => parseInt(a.response_text))
                          ).filter((n: number) => !isNaN(n))
                          if (ratings.length === 0) return null
                          const dist = [1, 2, 3, 4, 5].map(s => ratings.filter(n => n === s).length)
                          return (
                            <div className="glass rounded-xl p-4">
                              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribusi Rating</h4>
                              <BarChart labels={['1 Star', '2 Star', '3 Star', '4 Star', '5 Star']} data={dist} />
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Responses Tab */}
                    {currentTab === 'responses' && (
                      <div>
                        {data.responses.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                            <i className="bi bi-chat-dots text-3xl mb-2 block" />
                            <p>Belum ada jawaban masuk</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                            {data.responses.map((entry: any, i: number) => (
                              <div key={i} className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-sm flex items-center justify-center">
                                    {entry.member.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.member.full_name}</p>
                                    <p className="text-[11px] text-slate-400">NIM: {entry.member.nim}</p>
                                  </div>
                                </div>
                                <div className="space-y-2.5">
                                  {entry.answers.map((a: any) => (
                                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium sm:w-2/5 flex-shrink-0 pt-0.5">{a.question.question_text}</p>
                                      <div className="flex-1">
                                        {a.question.question_type === 'rating' ? (
                                          <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                              <i key={s} className={'bi ' + (parseInt(a.response_text) >= s ? 'bi-star-fill text-amber-400' : 'bi-star text-slate-200 dark:text-slate-600') + ' text-sm'} />
                                            ))}
                                            <span className="text-[11px] text-slate-400 ml-1">{a.response_text}/5</span>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-1.5">
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
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Perolehan Vote</h4>
                          {data.voteResults.length === 0 ? (
                            <p className="text-center text-slate-400 py-6">Belum ada vote</p>
                          ) : (
                            <div className="space-y-2.5">
                              {data.voteResults.map((v, i) => {
                                const pct = data.totalVotes > 0 ? (v.vote_count / data.totalVotes) * 100 : 0
                                const isWinner = i === 0
                                return (
                                  <div key={i}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        {isWinner && <i className="bi bi-trophy-fill text-amber-500 text-sm" />}
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{v.full_name}</span>
                                        <span className="text-[11px] text-slate-400">{v.nim}</span>
                                      </div>
                                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{v.vote_count} vote</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div className={'h-full rounded-full transition-all duration-1000 ' + (isWinner ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-300 dark:bg-slate-600')} style={{ width: pct + '%' }} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        {data.voteDetails.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Detail: Siapa Vote Siapa</h4>
                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                                    <th className="text-left px-4 py-2.5 font-semibold text-xs">#</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Pemilih</th>
                                    <th className="text-center px-4 py-2.5 font-semibold text-xs"></th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Dipilih</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.voteDetails.map((vd, i) => (
                                    <tr key={i} className="border-t border-slate-50 dark:border-slate-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                                      <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                                      <td className="px-4 py-2">
                                        <p className="font-medium text-slate-700 dark:text-slate-200">{vd.voter.full_name}</p>
                                        <p className="text-[10px] text-slate-400">{vd.voter.nim}</p>
                                      </td>
                                      <td className="px-4 py-2 text-center text-emerald-500"><i className="bi bi-arrow-right" /></td>
                                      <td className="px-4 py-2">
                                        <p className="font-medium text-slate-700 dark:text-slate-200">{vd.voted_for.full_name}</p>
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
