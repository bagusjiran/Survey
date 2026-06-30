'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

// Component to show vote results + anonymous survey responses
export default function VoteResultsScreen({ agendaId, agendaTitle, isSubmit, onBack }: {
  agendaId: string
  agendaTitle: string
  isSubmit: boolean
  onBack: () => void
}) {
  const [results, setResults] = useState<any[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [surveyData, setSurveyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState<'vote' | 'survey'>('vote')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [voteRes, surveyRes] = await Promise.all([
          fetch(`/api/votes?agendaId=${agendaId}`),
          fetch(`/api/responses?agendaId=${agendaId}&view=member`),
        ])

        if (!voteRes.ok) {
          console.error('Vote fetch failed:', voteRes.status)
        }
        if (!surveyRes.ok) {
          console.error('Survey fetch failed:', surveyRes.status)
          const errText = await surveyRes.text()
          console.error('Survey error body:', errText)
        }

        const voteData = voteRes.ok ? await voteRes.json() : { results: [], totalVotes: 0 }
        const surveyDataRaw = surveyRes.ok ? await surveyRes.json() : { responses: [], totalResponden: 0 }

        setResults(voteData.results || [])
        setTotalVotes(voteData.totalVotes || 0)
        setSurveyData(surveyDataRaw)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message || 'Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [agendaId])

  const maxVotes = results.length > 0 ? results[0].vote_count : 0
  const hasSurvey = surveyData?.responses?.length > 0

  return (
    <div className="min-h-screen animated-bg islamic-pattern">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Success Header */}
        <div className="glass rounded-2xl p-5 text-center mb-4 animate-scale-in">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            {isSubmit ? 'Terima Kasih!' : 'Sudah Memilih'}
          </h2>
          <p className="text-sm text-slate-500">{agendaTitle}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Tab Switch */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveView('vote')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeView === 'vote'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            🏆 Hasil Vote
          </button>
          <button
            onClick={() => setActiveView('survey')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeView === 'survey'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            📋 Jawaban Survey
          </button>
        </div>

        {/* Vote Results */}
        {activeView === 'vote' && (
          <div className="glass rounded-2xl p-5 mb-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🏆</span>
              <div>
                <h3 className="font-bold text-slate-800">Mahasiswa Teraktif</h3>
                <p className="text-xs text-slate-400">{totalVotes} total vote</p>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-6"><div className="spinner" /></div>
            ) : results.length === 0 ? (
              <p className="text-center text-slate-400 py-4">Belum ada vote</p>
            ) : (
              <div className="space-y-3">
                {results.map((r: any, i: number) => {
                  const pct = totalVotes > 0 ? (r.vote_count / totalVotes) * 100 : 0
                  const isWinner = r.vote_count === maxVotes && maxVotes > 0
                  return (
                    <div key={r.voted_for_id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {isWinner && <span className="text-base">🏆</span>}
                          <span className="text-sm font-medium text-slate-700">{r.full_name}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">{r.vote_count} vote</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            isWinner ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-300'
                          }`}
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

        {/* Survey Responses (Anonymous) */}
        {activeView === 'survey' && (
          <div className="space-y-3 animate-slide-up">
            {loading ? (
              <div className="flex justify-center py-6"><div className="spinner" /></div>
            ) : !hasSurvey ? (
              <div className="glass rounded-2xl text-center py-8 text-slate-400">
                <p>Belum ada jawaban survey masuk</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 px-1">
                  {surveyData.totalResponden} anggota sudah mengisi — jawaban bersifat anonim
                </p>
                {surveyData.responses.map((item: any, i: number) => (
                  <div key={i} className="glass rounded-2xl p-5">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="font-medium text-slate-700 text-sm">{item.question?.question_text || 'Pertanyaan'}</p>
                    </div>
                    <div className="ml-8 space-y-2">
                      {item.answers?.length > 0 ? item.answers.map((ans: string, j: number) => (
                        <div key={j} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                          {item.question?.question_type === 'rating' ? (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className={`w-4 h-4 ${parseInt(ans) >= star ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                              ))}
                              <span className="text-xs text-slate-400 ml-1">{ans}/5</span>
                            </div>
                          ) : (
                            <span>&ldquo;{ans}&rdquo;</span>
                          )}
                        </div>
                      )) : (
                        <p className="text-xs text-slate-400 italic">Belum ada jawaban</p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
        >
          Kembali ke Daftar Agenda
        </button>
      </div>
    </div>
  )
}
