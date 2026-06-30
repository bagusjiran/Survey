import supabase from '@/lib/supabase'
import Link from 'next/link'

async function getStats() {
  const [members, agendas, votes] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }),
    supabase.from('agendas').select('id', { count: 'exact', head: true }),
    supabase.from('active_student_votes').select('id', { count: 'exact', head: true }),
  ])

  const { data: recentAgendas } = await supabase
    .from('agendas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    memberCount: members.count || 0,
    agendaCount: agendas.count || 0,
    voteCount: votes.count || 0,
    recentAgendas: recentAgendas || [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    {
      label: 'Total Anggota',
      value: stats.memberCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Total Agenda',
      value: stats.agendaCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: 'Total Vote',
      value: stats.voteCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Selamat datang, Admin UKM Kerohanian Islam</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`animate-slide-up stagger-${i + 1} glass rounded-2xl p-6 hover-lift`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/anggota"
          className="glass rounded-2xl p-6 hover-lift flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Tambah Anggota</h3>
            <p className="text-sm text-slate-500">Kelola data anggota UKM</p>
          </div>
        </Link>

        <Link
          href="/admin/agenda"
          className="glass rounded-2xl p-6 hover-lift flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Buat Agenda</h3>
            <p className="text-sm text-slate-500">Tambah agenda kegiatan baru</p>
          </div>
        </Link>
      </div>

      {/* Recent Agendas */}
      <div className="glass rounded-2xl p-6 animate-slide-up stagger-3">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Agenda Terbaru</h2>
        {stats.recentAgendas.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Belum ada agenda</p>
        ) : (
          <div className="space-y-3">
            {stats.recentAgendas.map((agenda) => (
              <Link
                key={agenda.id}
                href={`/admin/agenda/${agenda.id}`}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${agenda.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <h3 className="font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">
                      {agenda.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {agenda.event_date
                        ? new Date(agenda.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Tanpa tanggal'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${
                  agenda.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {agenda.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
