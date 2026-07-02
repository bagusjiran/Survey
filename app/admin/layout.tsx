import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import DarkModeToggle from '@/components/DarkModeToggle'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session || !session.isAdmin) redirect('/')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar userName={session.fullName} />
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 px-4 lg:px-8 py-3 flex items-center justify-end gap-2">
          <DarkModeToggle />
          <NotificationBell />
        </div>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
