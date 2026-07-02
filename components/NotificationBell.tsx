'use client'

import { useState, useEffect, useRef } from 'react'
import { fetcher } from '@/lib/swr-fetcher'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  agenda_id: string | null
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const data = await fetcher('/api/notifications')
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : { markAll: true }),
      })
      fetchNotifications()
    } catch { /* ignore */ }
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Baru saja'
    if (mins < 60) return mins + ' menit lalu'
    const hours = Math.floor(mins / 60)
    if (hours < 24) return hours + ' jam lalu'
    const days = Math.floor(hours / 24)
    return days + ' hari lalu'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_agenda': return 'bi-calendar-plus text-blue-500'
      case 'deadline_reminder': return 'bi-clock text-amber-500'
      case 'vote_result': return 'bi-trophy text-emerald-500'
      case 'survey_reminder': return 'bi-clipboard-check text-violet-500'
      default: return 'bi-bell text-slate-500'
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Notifikasi"
      >
        <i className="bi bi-bell text-lg text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Tidak ada notifikasi
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.read) markAsRead(n.id) }}
                  className={'w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 ' +
                    (!n.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : '')}
                >
                  <div className="flex items-start gap-3">
                    <i className={'bi ' + getTypeIcon(n.type) + ' text-base mt-0.5'} />
                    <div className="flex-1 min-w-0">
                      <p className={'text-xs font-medium text-slate-800 dark:text-slate-200 ' + (!n.read ? 'font-semibold' : '')}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        {getTimeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
