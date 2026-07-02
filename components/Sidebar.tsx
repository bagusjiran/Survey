'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { href: '/admin/anggota', label: 'Kelola Anggota', icon: 'bi-people' },
  { href: '/admin/roles', label: 'Kelola Role', icon: 'bi-shield-lock' },
  { href: '/admin/agenda', label: 'Kelola Agenda', icon: 'bi-calendar3' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: 'bi-shield-check' },
  { href: '/survey', label: 'Kembali ke Survey', icon: 'bi-arrow-left-circle', external: true },
]

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <i className="bi bi-building text-white text-lg" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">UKM Kerohanian</h2>
            <p className="text-emerald-300 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              (item as any).external
                ? 'text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 mt-2'
                : isActive(item.href)
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <i className={'bi ' + item.icon + ' text-lg'} />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3 px-3">
          <p className="text-xs text-slate-400">Login sebagai</p>
          <p className="text-sm text-white font-medium truncate">{userName}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
        >
          <i className="bi bi-box-arrow-left text-lg" />
          <span className="font-medium text-sm">{loggingOut ? 'Keluar...' : 'Keluar'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass shadow-lg"
      >
        <i className={'bi ' + (mobileOpen ? 'bi-x-lg' : 'bi-list') + ' text-xl text-slate-700 dark:text-slate-200'} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-slate-900 z-40 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-slate-900 z-30">
        <SidebarContent />
      </aside>
    </>
  )
}
