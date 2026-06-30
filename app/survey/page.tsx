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

interface SurveyItem {
  question: { question_text: string; question_type: string }
  answers: string[]
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
  const [agendaSurvey, setAgendaSurvey] = useState<Record<string, { items: SurveyItem[]; total: number }>>({})
  const [expandedSurvey, setExpandedSurvey] = useState<Record<string, boolean>>({})
  const [loggingOut, setLoggingOut] = useState(false)
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

        // Fetch vote results + survey responses for each agenda
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
              surveyMap[a.id] = {
                items: sData.responses || [],
                total: sData.totalResponden || 0,
              }
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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return function () { document.removeEventListener('mousedown', handleClick) }
  }, [])

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

  return (
    <div className="survey-page">
      <div className="survey-container">
        {/* Header */}
        <div className="survey-header">
          <div className="survey-header-left">
            <div className="survey-logo">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <div>
              <h1 className="survey-brand">Survey UKM Kerohanian</h1>
              <p className="survey-brand-sub">UTR Cepu</p>
            </div>
          </div>

          {/* Profile Menu */}
          <div className="survey-profile" ref={profileRef}>
            <button
              onClick={function () { setShowProfile(!showProfile) }}
              className="survey-profile-btn"
            >
              <div className="survey-avatar">
                {session?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="survey-profile-name">{session?.fullName || '...'}</span>
              {session?.isAdmin && <span className="survey-admin-badge">Admin</span>}
            </button>

            {showProfile && (
              <div className="survey-dropdown">
                <div className="survey-dropdown-header">
                  <p className="survey-dropdown-name">{session?.fullName}</p>
                  <p className="survey-dropdown-nim">NIM: {session?.nim}</p>
                </div>
                {session?.isAdmin && (
                  <button
                    onClick={function () { window.location.href = '/admin' }}
                    className="survey-dropdown-item"
                  >
                    📊 Dashboard Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="survey-dropdown-logout"
                >
                  🚪 {loggingOut ? 'Keluar...' : 'Keluar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Agenda Cards */}
        {loading ? (
          <div className="survey-loading"><div className="spinner"></div></div>
        ) : agendas.length === 0 ? (
          <div className="survey-empty">
            <p>Belum ada agenda aktif</p>
          </div>
        ) : (
          <div className="survey-list">
            {agendas.map(function (agenda) {
              var votes = agendaVotes[agenda.id] || []
              var survey = agendaSurvey[agenda.id] || { items: [], total: 0 }
              var isExpanded = expandedSurvey[agenda.id] || false
              var showItems = isExpanded ? survey.items : survey.items.slice(0, 2)
              var hasMore = survey.items.length > 2

              return (
                <div key={agenda.id} className="survey-card">
                  {/* Agenda Info */}
                  <div
                    className="survey-card-header"
                    onClick={function () { router.push('/survey/' + agenda.id) }}
                  >
                    <div className="survey-card-dot"></div>
                    <div className="survey-card-info">
                      <h3 className="survey-card-title">{agenda.title}</h3>
                      {agenda.description && (
                        <p className="survey-card-desc">{agenda.description}</p>
                      )}
                      <p className="survey-card-date">
                        {agenda.event_date
                          ? new Date(agenda.event_date).toLocaleDateString('id-ID', {
                              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                            })
                          : 'Tanggal belum ditentukan'}
                      </p>
                    </div>
                  </div>

                  {/* Vote Results */}
                  {votes.length > 0 && (
                    <div className="survey-vote-section">
                      <div className="survey-vote-title">
                        <span>🏆</span>
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
                                <span className="survey-vote-count">{v.vote_count}</span>
                              </div>
                              <div className="survey-vote-bar-bg">
                                <div
                                  className={'survey-vote-bar' + (j === 0 ? ' survey-vote-bar-top' : '')}
                                  style={{ width: pct + '%' }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Survey Responses (limited) */}
                  {survey.items.length > 0 && (
                    <div className="survey-response-section">
                      <div className="survey-response-title">
                        <span>💬</span>
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
                                    return (
                                      <div key={j} className="survey-response-rating">
                                        {[1, 2, 3, 4, 5].map(function (s) {
                                          return (
                                            <span key={s} className={'star' + (parseInt(ans) >= s ? ' star-on' : '')}>★</span>
                                          )
                                        })}
                                        <span className="survey-response-rating-num">{ans}/5</span>
                                      </div>
                                    )
                                  }
                                  return (
                                    <p key={j} className="survey-response-text">&ldquo;{ans}&rdquo;</p>
                                  )
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
                        <button
                          onClick={function () { toggleExpand(agenda.id) }}
                          className="survey-expand-btn"
                        >
                          {isExpanded ? '▲ Tutup' : '▼ Lihat Selengkapnya (' + survey.items.length + ' pertanyaan)'}
                        </button>
                      )}
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
