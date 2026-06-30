'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import VoteResultsScreen from './VoteResultsScreen'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  sort_order: number
}

interface Agenda {
  id: string
  title: string
  description: string
}

interface Member {
  id: string
  full_name: string
  nim: string
  is_admin: boolean
}

interface SessionData {
  memberId: string
  fullName: string
  nim: string
  isAdmin: boolean
}

export default function SurveyFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agendaId } = use(params)
  const router = useRouter()

  const [agenda, setAgenda] = useState<Agenda | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [session, setSession] = useState<SessionData | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [voteChoice, setVoteChoice] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agendaRes, questionsRes, membersRes, sessionRes, checkRes] = await Promise.all([
          fetch(`/api/agendas?id=${agendaId}`),
          fetch(`/api/questions?agendaId=${agendaId}`),
          fetch('/api/members'),
          fetch('/api/auth/session'),
          fetch(`/api/survey?agendaId=${agendaId}`),
        ])

        const agendaData = await agendaRes.json()
        const questionsData = await questionsRes.json()
        const membersData = await membersRes.json()
        const sessionData = await sessionRes.json()
        const checkData = await checkRes.json()

        setAgenda(agendaData.agenda)
        setQuestions(questionsData.questions || [])
        setSession(sessionData)

        // Filter members for voting: exclude self and chairman (NIM 24550011)
        const allMembers: Member[] = membersData.members || []
        const eligible = allMembers.filter(
          (m) => m.id !== sessionData.memberId && m.nim !== '24550011'
        )
        setMembers(eligible)

        // Check if already voted (vote is the mandatory part)
        if (checkData.alreadySubmitted) {
          setAlreadySubmitted(true)
        }
      } catch {
        showToast('Gagal memuat data', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [agendaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all questions answered (only if questions exist)
    for (const q of questions) {
      if (!responses[q.id] || responses[q.id].trim() === '') {
        showToast('Harap jawab semua pertanyaan', 'error')
        return
      }
    }

    // Validate vote (ALWAYS mandatory)
    if (!voteChoice) {
      showToast('Harap pilih mahasiswa teraktif', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Step 1: Submit survey responses (only if questions exist)
      if (questions.length > 0) {
        const surveyRes = await fetch('/api/survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agendaId,
            responses: Object.entries(responses).map(([questionId, responseText]) => ({
              questionId,
              responseText,
            })),
          }),
        })

        if (!surveyRes.ok) {
          const data = await surveyRes.json()
          if (data.error !== 'Anda sudah mengisi survey ini') {
            showToast(data.error || 'Gagal mengirim survey', 'error')
            setSubmitting(false)
            return
          }
        }
      }

      // Step 2: Submit vote (ALWAYS mandatory)
      const voteRes = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendaId,
          votedForIds: [voteChoice],
        }),
      })

      if (!voteRes.ok) {
        const data = await voteRes.json()
        showToast(data.error || 'Gagal menyimpan vote', 'error')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="spinner !w-10 !h-10" />
      </div>
    )
  }

  // Success / Already submitted screen
  if (submitted || alreadySubmitted) {
    return (
      <VoteResultsScreen
        agendaId={agendaId}
        agendaTitle={agenda?.title || ''}
        isSubmit={submitted}
        onBack={() => router.push('/survey')}
      />
    )
  }

  return (
    <div className="min-h-screen animated-bg islamic-pattern">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 toast-enter px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/survey')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </button>

        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-6 animate-slide-up">
          <h1 className="text-xl font-bold text-slate-800 mb-1">{agenda?.title}</h1>
          {agenda?.description && <p className="text-sm text-slate-500">{agenda.description}</p>}
          <p className="text-xs text-slate-400 mt-2">
            {questions.length > 0
              ? 'Isi pertanyaan berikut dan pilih mahasiswa teraktif'
              : 'Pilih mahasiswa teraktif untuk kegiatan ini'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Questions (only if exist) */}
          {questions.length > 0 && (
            <div className="space-y-4 mb-6">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="glass rounded-2xl p-6 animate-slide-up"
                  style={{ animationDelay: `${(i + 1) * 0.1}s` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <label className="font-medium text-slate-700">{q.question_text}</label>
                  </div>

                  <div className="ml-10">
                    {/* Text input */}
                    {q.question_type === 'text' && (
                      <input
                        type="text"
                        placeholder="Jawaban Anda..."
                        value={responses[q.id] || ''}
                        onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all text-base"
                        style={{ fontSize: '16px' }}
                      />
                    )}

                    {/* Textarea */}
                    {q.question_type === 'textarea' && (
                      <textarea
                        placeholder="Jawaban Anda..."
                        value={responses[q.id] || ''}
                        onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all resize-none text-base"
                        style={{ fontSize: '16px' }}
                      />
                    )}

                    {/* Radio */}
                    {q.question_type === 'radio' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt: string, j: number) => (
                          <label
                            key={j}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                              responses[q.id] === opt
                                ? 'bg-emerald-50 border-2 border-emerald-300'
                                : 'hover:bg-slate-50 border-2 border-transparent'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={opt}
                              checked={responses[q.id] === opt}
                              onChange={() => setResponses({ ...responses, [q.id]: opt })}
                              className="w-4 h-4 text-emerald-500"
                            />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Rating */}
                    {q.question_type === 'rating' && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setResponses({ ...responses, [q.id]: String(star) })}
                            className="transition-transform hover:scale-110"
                          >
                            <svg
                              className={`w-10 h-10 ${
                                parseInt(responses[q.id] || '0') >= star
                                  ? 'text-amber-400'
                                  : 'text-slate-200'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                          </button>
                        ))}
                        {responses[q.id] && (
                          <span className="self-center text-sm text-slate-500 ml-2">
                            {responses[q.id]}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================ */}
          {/* VOTE SECTION — SELALU MUNCUL SETIAP AGENDA  */}
          {/* ============================================ */}
          <div className="glass rounded-2xl p-6 mb-6 animate-slide-up border-2 border-emerald-200" style={{ animationDelay: `${(questions.length + 1) * 0.1}s` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-xl">🏆</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Pilih Mahasiswa Teraktif</h3>
                <p className="text-xs text-slate-500">Wajib dipilih — 1 mahasiswa per anggota</p>
              </div>
            </div>

            <select
              value={voteChoice}
              onChange={(e) => setVoteChoice(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all text-slate-700 font-medium"
              style={{ fontSize: '16px' }}
            >
              <option value="">-- Pilih Mahasiswa Teraktif --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.nim})
                </option>
              ))}
            </select>

            {members.length === 0 && (
              <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                Tidak ada mahasiswa lain yang tersedia untuk dipilih
              </p>
            )}

            {voteChoice && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-slide-up">
                <p className="text-sm text-emerald-700 font-medium">
                  ✓ Anda memilih: {members.find((m) => m.id === voteChoice)?.full_name}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !voteChoice}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {submitting ? (
              <>
                <div className="spinner !border-white/30 !border-t-white !w-5 !h-5" />
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                {questions.length > 0 ? 'Kirim Survey & Vote' : 'Kirim Vote'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
