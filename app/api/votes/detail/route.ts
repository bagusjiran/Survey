import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: Admin-only endpoint to see who voted for whom
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  if (!agendaId) {
    return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
  }

  // Get all votes with voter and voted_for details
  const { data: votes, error } = await supabase
    .from('active_student_votes')
    .select('id, voter_id, voted_for_id, created_at')
    .eq('agenda_id', agendaId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  if (!votes || votes.length === 0) {
    return NextResponse.json({ votes: [], voters: [], candidates: [] })
  }

  // Get all unique member IDs
  const voterIds = Array.from(new Set(votes.map(v => v.voter_id)))
  const candidateIds = Array.from(new Set(votes.map(v => v.voted_for_id)))
  const allIds = voterIds.concat(candidateIds.filter(id => !voterIds.includes(id)))

  const { data: members } = await supabase
    .from('members')
    .select('id, full_name, nim')
    .in('id', allIds)

  const memberMap = new Map((members || []).map(m => [m.id, m]))

  // Build detailed vote list
  const detailedVotes = votes.map(v => ({
    id: v.id,
    voter: memberMap.get(v.voter_id) || { full_name: 'Unknown', nim: '---' },
    voted_for: memberMap.get(v.voted_for_id) || { full_name: 'Unknown', nim: '---' },
    created_at: v.created_at,
  }))

  // Build vote counts
  const voteCounts: Record<string, number> = {}
  for (const v of votes) {
    voteCounts[v.voted_for_id] = (voteCounts[v.voted_for_id] || 0) + 1
  }

  const candidates = Object.entries(voteCounts)
    .map(([id, count]) => ({
      id,
      full_name: memberMap.get(id)?.full_name || 'Unknown',
      nim: memberMap.get(id)?.nim || '---',
      vote_count: count,
    }))
    .sort((a, b) => b.vote_count - a.vote_count)

  return NextResponse.json({
    votes: detailedVotes,
    candidates,
    totalVotes: votes.length,
  })
}
