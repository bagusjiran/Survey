'use client'

import { useState, useEffect, use } from 'react'

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
  is_active: boolean
}

interface VoteResult {
  voted_for_id: string
  full_name: string
  nim: string
  vote_count: number
}

interface SurveyResponse {
  id: string
  response_text: string
  member_id: string
  question_id: string
  member: { full_name: string; nim: string }
  question: { question_text: string; question_type: string }
}

interface Member {
  id: string
  full_name: string
  nim: string
  is_admin: boolean
}

export default function AgendaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agendaId } = use(params)
  const [agenda, setAgenda] = useState<Agenda | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [voteResults, setVoteResults] = useState<VoteResult[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddQ, setShowAddQ] = useState(false)
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ question_text: '', question_type: 'text', options: [''] })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'questions' | 'votes' | 'responses'>('questions')
  const [adminVotes, setAdminVotes] = useState<string[]>([])
  const [votingLoading, setVotingLoading] = useState(false)
  const [responses, setResponses] = useState<any[]>([])
  const [totalResponden, setTotalResponden] = useState(0)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      const [agendaRes, questionsRes, votesRes, membersRes, responsesRes] = await Promise.all([
        fetch(`/api/agendas?id=${agendaId}`),
        fetch(`/api/questions?agendaId=${agendaId}`),
        fetch(`/api/votes?agendaId=${agendaId}`),
        fetch('/api/members'),
        fetch(`/api/responses?agendaId=${agendaId}`),
      ])

      const agendaData = await agendaRes.json()
      const questionsData = await questionsRes.json()
      const votesData = await votesRes.json()
      const membersData = await membersRes.json()
      const responsesData = await responsesRes.json()

      setAgenda(agendaData.agenda)
      setQuestions(questionsData.questions || [])
      setVoteResults(votesData.results || [])
      setMembers(membersData.members || [])
      setResponses(responsesData.responses || [])
      setTotalResponden(responsesData.totalResponden || 0)
    } catch {
      showToast('Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [agendaId])

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body: any = {
        agenda_id: agendaId,
        question_text: qForm.question_text,
        question_type: qForm.question_type,
        sort_order: questions.length,
      }
      if (qForm.question_type === 'radio') {
        body.options = qForm.options.filter((o) => o.trim() !== '')
      }

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Gagal menambah pertanyaan', 'error')
        return
      }

      showToast('Pertanyaan berhasil ditambahkan!', 'success')
      setQForm({ question_text: '', question_type: 'text', options: [''] })
      setShowAddQ(false)
      fetchData()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pertanyaan ini?')) return
    try {
      const res = await fetch('/api/questions?id=' + id, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Gagal menghapus pertanyaan', 'error')
        return
      }
      showToast('Pertanyaan dihapus', 'success')
      fetchData()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const startEdit = (q: Question) => {
    setEditingQ(q)
    setQForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options && q.options.length > 0 ? q.options : [''],
    })
    setShowAddQ(true)
  }

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQ) return
    setSaving(true)
    try {
      const body: any = {
        id: editingQ.id,
        question_text: qForm.question_text,
        question_type: qForm.question_type,
      }
      if (qForm.question_type === 'radio') {
        body.options = qForm.options.filter((o) => o.trim() !== '')
      }

      const res = await fetch('/api/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Gagal mengupdate pertanyaan', 'error')
        return
      }

      showToast('Pertanyaan berhasil diupdate!', 'success')
      setQForm({ question_text: '', question_type: 'text', options: [''] })
      setEditingQ(null)
      setShowAddQ(false)
      fetchData()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cancelForm = () => {
    setShowAddQ(false)
    setEditingQ(null)
    setQForm({ question_text: '', question_type: 'text', options: [''] })
  }

  const handleAdminVote = async () => {
    if (adminVotes.length === 0) {
      showToast('Pilih minimal 1 mahasiswa', 'error')
      return
    }
    if (adminVotes.length > 2) {
      showToast('Admin maksimal memilih 2 mahasiswa', 'error')
      return
    }
    setVotingLoading(true)
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agendaId, votedForIds: adminVotes }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan vote', 'error')
        return
      }
      showToast('Vote berhasil disimpan!', 'success')
      setAdminVotes([])
      fetchData()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setVotingLoading(false)
    }
  }

  // Exclude only chairman (NIM 24550011) from voting list
  const votableMembers = members.filter((m) => m.nim !== '24550011')
  const totalVotes = voteResults.reduce((sum, v) => sum + v.vote_count, 0)
  const maxVotes = voteResults.length > 0 ? Math.max(...voteResults.map((v) => v.vote_count)) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toast?.message}
      </div>
      {toast && (
        <div role="alert" className={`fixed top-4 right-4 z-50 toast-enter px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{agenda?.title || 'Detail Agenda'}</h1>
        {agenda?.description && <p className="text-slate-500 mt-1">{agenda.description}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'questions'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pertanyaan ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('votes')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'votes'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Hasil Vote ({totalVotes})
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'responses'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Jawaban ({responses.length})
        </button>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div>
          <button
            onClick={() => { if (editingQ) { cancelForm() } else { setShowAddQ(!showAddQ) } }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {showAddQ ? 'Tutup Form' : 'Tambah Pertanyaan'}
          </button>

          {showAddQ && (
            <div className="glass rounded-2xl p-6 mb-4 animate-slide-up">
              <form onSubmit={editingQ ? handleEditQuestion : handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teks Pertanyaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bagaimana pendapat Anda tentang kegiatan ini?"
                    value={qForm.question_text}
                    onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Jawaban</label>
                  <select
                    value={qForm.question_type}
                    onChange={(e) => setQForm({ ...qForm, question_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
                  >
                    <option value="text">Teks Pendek</option>
                    <option value="textarea">Teks Panjang</option>
                    <option value="radio">Pilihan Ganda</option>
                    <option value="rating">Rating (1-5)</option>
                  </select>
                </div>

                {qForm.question_type === 'radio' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Opsi Pilihan</label>
                    {qForm.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder={`Opsi ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...qForm.options]
                            newOpts[i] = e.target.value
                            setQForm({ ...qForm, options: newOpts })
                          }}
                          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white/60 focus:border-emerald-400 transition-all"
                        />
                        {qForm.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQForm({ ...qForm, options: qForm.options.filter((_, j) => j !== i) })}
                            className="px-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setQForm({ ...qForm, options: [...qForm.options, ''] })}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      + Tambah Opsi
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan...' : (editingQ ? 'Update' : 'Simpan')}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-600 font-medium hover:bg-slate-300 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="glass rounded-2xl text-center py-12 text-slate-400">
              Belum ada pertanyaan. Tambahkan pertanyaan untuk survey ini.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="glass rounded-2xl p-5 hover-lift animate-slide-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          q.question_type === 'text' ? 'bg-blue-100 text-blue-700' :
                          q.question_type === 'textarea' ? 'bg-purple-100 text-purple-700' :
                          q.question_type === 'radio' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {q.question_type === 'text' ? 'Teks' :
                           q.question_type === 'textarea' ? 'Paragraf' :
                           q.question_type === 'radio' ? 'Pilihan' : 'Rating'}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium mt-2">{q.question_text}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {q.options.map((opt: string, j: number) => (
                            <span key={j} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(q)}
                        className="text-blue-400 hover:text-blue-600 transition-colors p-1"
                        title="Edit pertanyaan"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus pertanyaan"
                      >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Votes Tab */}
      {activeTab === 'votes' && (
        <div>
          {/* Admin Vote Section */}
          <div className="glass rounded-2xl p-6 mb-6 animate-slide-up">
            <h3 className="font-semibold text-slate-800 mb-3">Vote Mahasiswa Teraktif (Admin: pilih maks. 2)</h3>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {votableMembers.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    adminVotes.includes(m.id)
                      ? 'bg-emerald-50 border-2 border-emerald-300'
                      : 'hover:bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={adminVotes.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (adminVotes.length < 2) {
                          setAdminVotes([...adminVotes, m.id])
                        } else {
                          showToast('Maksimal 2 pilihan', 'error')
                        }
                      } else {
                        setAdminVotes(adminVotes.filter((id) => id !== m.id))
                      }
                    }}
                    className="w-4 h-4 text-emerald-500 rounded"
                  />
                  <div>
                    <span className="font-medium text-slate-700">{m.full_name}</span>
                    <span className="text-sm text-slate-400 ml-2">({m.nim})</span>
                  </div>
                </label>
              ))}
              {votableMembers.length === 0 && (
                <p className="text-slate-400 text-center py-4">Belum ada anggota</p>
              )}
            </div>
            <button
              onClick={handleAdminVote}
              disabled={votingLoading || adminVotes.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {votingLoading ? 'Menyimpan...' : 'Simpan Vote'}
            </button>
          </div>

          {/* Vote Results */}
          <div className="glass rounded-2xl p-6 animate-slide-up stagger-2">
            <h3 className="font-semibold text-slate-800 mb-4">Hasil Vote Sementara</h3>
            {voteResults.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Belum ada vote masuk</p>
            ) : (
              <div className="space-y-3">
                {voteResults.map((result, i) => {
                  const percentage = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0
                  const isWinner = result.vote_count === maxVotes && maxVotes > 0
                  return (
                    <div key={result.voted_for_id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {isWinner && (
                            <span className="text-lg">🏆</span>
                          )}
                          <span className="font-medium text-slate-700">{result.full_name}</span>
                          <span className="text-xs text-slate-400">({result.nim})</span>
                        </div>
                        <span className="font-bold text-emerald-600">{result.vote_count} vote</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            isWinner
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                              : 'bg-gradient-to-r from-slate-300 to-slate-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responses Tab */}
      {activeTab === 'responses' && (
        <div>
          {responses.length === 0 ? (
            <div className="glass rounded-2xl text-center py-12 text-slate-400">
              <p className="text-lg">Belum ada jawaban masuk</p>
              <p className="text-sm mt-1">Jawaban anggota akan muncul di sini setelah mereka mengisi survey</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">{totalResponden} anggota sudah mengisi survey</p>
              {responses.map((entry: any, i: number) => (
                <div key={i} className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                      {entry.member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{entry.member.full_name}</p>
                      <p className="text-[10px] text-slate-400">{entry.member.nim}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {entry.answers.map((a: any) => (
                      <div key={a.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                        <p className="text-xs text-slate-500 font-medium sm:w-1/3">{a.question.question_text}</p>
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
                            <p className="text-xs text-slate-700 bg-slate-50 rounded px-2 py-1">
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
    </div>
  )
}
