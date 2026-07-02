'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SkeletonList } from '@/components/SkeletonLoader'
import DarkModeToggle from '@/components/DarkModeToggle'

interface Agenda {
  id: string
  title: string
  description: string
  event_date: string | null
  is_active: boolean
}

interface VoteResult {
  full_name: string
  vote_count: number
}

interface SurveyItem {
  question: { question_text: string; question_type: string }
  answers: string[]
}

interface SessionData {
  memberId: string
  fullName: string
  isAdmin: boolean
}

export default function SurveyListPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionData | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [agendaVotes, setAgendaVotes] = useState<Record<string, VoteResult[]>>({})
  const [agendaSurvey, setAgendaSurvey] = useState<Record<string, { items: SurveyItem[]; total: number }>>({})
  const [expandedSurvey, setExpandedSurvey] = useState<Record<string, boolean>>({})
  const [loggingOut, setLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    var fetchData = async function () {
      try {
        var [agendaRes, sessionRes] = await Promise.all([
          fetch('/api/agendas?active=true'),
          fetch('/api/auth/session'),
        ])
        var agendaData = await agendaRes.json()
        var sessionData = await sessionRes.json()
        setAgendas(agendaData.agendas || [])
        setSession(sessionData)

        var votesMap: Record<string, VoteResult[]> = {}
        var surveyMap: Record<string, { items: SurveyItem[]; total: number }> = {}

        await Promise.all(
          (agendaData.agendas || []).map(async function (a: Agenda) {
            try {
              var [vRes, sRes] = await Promise.all([
                fetch('/api/votes?agendaId=' + a.id),
                fetch('/api/responses?agendaId=' + a.id + '&view=member'),
              ])
              var vData = await vRes.json()
              var sData = await sRes.json()
              votesMap[a.id] = vData.results || []
              surveyMap[a.id] = { items: sData.responses || [], total: sData.totalResponden || 0 }
            } catch (e) { /* skip */ }
          })
        )
        setAgendaVotes(votesMap)
        setAgendaSurvey(surveyMap)
      } catch (e) {
        console.error('Failed to fetch')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(function () {
    var handleClick = function (e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClick)
    return function () { document.removeEventListener('mousedown', handleClick) }
  }, [])

  useEffect(function () {
    var handleKey = function (e: KeyboardEvent) {
      if (e.key === 'Escape' && showProfile) setShowProfile(false)
    }
    document.addEventListener('keydown', handleKey)
    return function () { document.removeEventListener('keydown', handleKey) }
  }, [showProfile])

  var handleLogout = async function () {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  var toggleExpand = function (agendaId: string) {
    setExpandedSurvey(function (prev) {
      var next = Object.assign({}, prev)
      next[agendaId] = !next[agendaId]
      return next
    })
  }

  // Filter agendas based on search
  var filteredAgendas = agendas.filter(function (a) {
    if (!searchQuery) return true
    var q = searchQuery.toLowerCase()
    return a.title.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q))
  })

  if (loading) {
    return (
      <div className="survey-page">
        <div className="survey-container py-8">
          <SkeletonList count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="survey-page">
      <div className="survey-container">
        {/* Header */}
        <header className="survey-header">
          <div className="survey-header-left">
            <div className="survey-logo" aria-hidden="true">
              <i className="bi bi-building text-white text-lg" />
            </div>
            <div>
              <h1 className="survey-brand">Survey UKM Kerohanian</h1>
              <p className="survey-brand-sub">UTR Cepu</p>
            </div>
          </div>

          <nav className="flex items-center gap-2" ref={profileRef} aria-label="Menu profil">
            <DarkModeToggle />
            <div className="relative">
              <button
                onClick={function () { setShowProfile(!showProfile) }}
                className="survey-profile-btn"
                aria-expanded={showProfile}
                aria-haspopup="true"
              >
                <div className="survey-avatar" aria-hidden="true">
                  {session?.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="survey-profile-name">{session?.fullName || '...'}</span>
                {session?.isAdmin && <span className="survey-admin-badge">Admin</span>}
              </button>

              {showProfile && (
                <div className="survey-dropdown" role="menu">
                  <div className="survey-dropdown-header">
                    <p className="survey-dropdown-name">{session?.fullName}</p>
                  </div>
                  {session?.isAdmin && (
                    <button onClick={function () { window.location.href = '/admin' }} className="survey-dropdown-item" role="menuitem">
                      <i className="bi bi-grid-1x2 mr-2" />Dashboard Admin
                    </button>
                  )}
                  <button onClick={handleLogout} disabled={loggingOut} className="survey-dropdown-logout" role="menuitem">
                    <i className="bi bi-box-arrow-left mr-2" />{loggingOut ? 'Keluar...' : 'Keluar'}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari agenda..."
              value={searchQuery}
              onChange={function (e) { setSearchQuery(e.target.value) }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all text-sm text-slate-800 dark:text-slate-100"
              style={{ fontSize: '16px' }}
            />
            {searchQuery && (
              <button
                onClick={function () { setSearchQuery('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <i className="bi bi-x-lg text-sm" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-slate-400 mt-2">
              Ditemukan {filteredAgendas.length} agenda
            </p>
          )}
        </div>

        <div aria-live="polite" className="sr-only">
          {filteredAgendas.length + ' agenda ditemukan'}
        </div>

        {filteredAgendas.length === 0 ? (
          <div className="survey-empty" role="status">
            <i className="bi bi-inbox text-4xl mb-3 block text-slate-300" />
            <p>{searchQuery ? 'Tidak ada agenda yang cocok' : 'Belum ada agenda aktif'}</p>
          </div>
        ) : (
          <main className="survey-list" role="list" aria-label="Daftar agenda survey">
            {filteredAgendas.map(function (agenda) {
              var votes = agendaVotes[agenda.id] || []
              var survey = agendaSurvey[agenda.id] || { items: [], total: 0 }
              var isExpanded = expandedSurvey[agenda.id] || false
              var showItems = isExpanded ? survey.items : survey.items.slice(0, 2)
              var hasMore = survey.items.length > 2

              return (
                <article key={agenda.id} className="survey-card" role="listitem">
                  <div
                    className="survey-card-header"
                    onClick={function () { router.push('/survey/' + agenda.id) }}
                    onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/survey/' + agenda.id) } }}
                    role="button"
                    tabIndex={0}
                    aria-label={'Buka survey: ' + agenda.title}
                  >
                    <div className="survey-card-dot" aria-hidden="true"></div>
                    <div className="survey-card-info">
                      <h2 className="survey-card-title">{agenda.title}</h2>
                      {agenda.description && <p className="survey-card-desc">{agenda.description}</p>}
                      <p className="survey-card-date">
                        {agenda.event_date
                          ? new Date(agenda.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Tanggal belum ditentukan'}
                      </p>
                    </div>
                  </div>

                  {votes.length > 0 && (
                    <section className="survey-vote-section" aria-label="Hasil vote">
                      <div className="survey-vote-title">
                        <i className="bi bi-trophy-fill text-amber-500 mr-2" />
                        <span>Mahasiswa Teraktif</span>
                      </div>
                      <div className="survey-vote-list">
                        {votes.slice(0, 3).map(function (v, j) {
                          var maxV = votes[0].vote_count
                          var pct = maxV > 0 ? (v.vote_count / maxV) * 100 : 0
                          return (
                            <div key={j} className="survey-vote-item">
                              <div className="survey-vote-row">
                                <span className="survey-vote-rank">{j + 1}.</span>
                                <span className="survey-vote-name">{v.full_name}</span>
                                <span className="survey-vote-count" aria-label={v.vote_count + ' vote'}>{v.vote_count}</span>
                              </div>
                              <div className="survey-vote-bar-bg" role="progressbar" aria-valuenow={v.vote_count} aria-valuemin={0} aria-valuemax={maxV}>
                                <div className={'survey-vote-bar' + (j === 0 ? ' survey-vote-bar-top' : '')} style={{ width: pct + '%' }}></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {survey.items.length > 0 && (
                    <section className="survey-response-section" aria-label="Jawaban survey">
                      <div className="survey-response-title">
                        <i className="bi bi-chat-dots text-emerald-500 mr-2" />
                        <span>Jawaban Survey ({survey.total} anggota)</span>
                      </div>
                      <div className="survey-response-list">
                        {showItems.map(function (item, i) {
                          return (
                            <div key={i} className="survey-response-item">
                              <p className="survey-response-q">{item.question?.question_text}</p>
                              <div className="survey-response-answers">
                                {item.answers.slice(0, isExpanded ? 999 : 3).map(function (ans, j) {
                                  if (item.question?.question_type === 'rating') {
                                    var ratingVal = parseInt(ans)
                                    return (
                                      <div key={j} className="survey-response-rating" aria-label={'Rating ' + ans + ' dari 5'}>
                                        {[1, 2, 3, 4, 5].map(function (s) {
                                          return <i key={s} className={'bi ' + (ratingVal >= s ? 'bi-star-fill text-amber-400' : 'bi-star text-slate-200') + ' text-sm'} />
                                        })}
                                        <span className="survey-response-rating-num">{ans}/5</span>
                                      </div>
                                    )
                                  }
                                  return <p key={j} className="survey-response-text">&ldquo;{ans}&rdquo;</p>
                                })}
                                {!isExpanded && item.answers.length > 3 && (
                                  <p className="survey-response-more">+{item.answers.length - 3} jawaban lainnya</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {hasMore && (
                        <button onClick={function () { toggleExpand(agenda.id) }} className="survey-expand-btn" aria-expanded={isExpanded}>
                          {isExpanded ? 'Tutup' : 'Lihat Selengkapnya (' + survey.items.length + ' pertanyaan)'}
                        </button>
                      )}
                    </section>
                  )}
                </article>
              )
            })}
          </main>
        )}
      </div>
    </div>
  )
}
