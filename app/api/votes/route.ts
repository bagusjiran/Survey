import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// Get vote results — ALL authenticated users can see (counts only, no voter details)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  if (!agendaId) {
    return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
  }

  // Get vote counts grouped by voted_for_id (no voter details exposed)
  const { data: votes, error } = await supabase
    .from('active_student_votes')
    .select('voted_for_id')
    .eq('agenda_id', agendaId)

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  // Count votes per candidate
  const voteCounts: Record<string, number> = {}
  for (const vote of votes || []) {
    voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1
  }

  const candidateIds = Object.keys(voteCounts)
  if (candidateIds.length === 0) {
    return NextResponse.json({ results: [], totalVotes: 0 })
  }

  // Get member details for each candidate
  const { data: members } = await supabase
    .from('members')
    .select('id, full_name, nim')
    .in('id', candidateIds)

  const results = (members || [])
    .map((m) => ({
      voted_for_id: m.id,
      full_name: m.full_name,
      nim: m.nim,
      vote_count: voteCounts[m.id] || 0,
    }))
    .sort((a, b) => b.vote_count - a.vote_count)

  const totalVotes = (votes || []).length

  return NextResponse.json({ results, totalVotes })
}

// Submit vote
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agendaId, votedForIds } = await request.json()

    if (!agendaId || !votedForIds || !Array.isArray(votedForIds)) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Validate vote count
    const maxVotes = session.isAdmin ? 2 : 1
    if (votedForIds.length === 0 || votedForIds.length > maxVotes) {
      return NextResponse.json({
        error: session.isAdmin ? 'Admin bisa memilih 1-2 mahasiswa' : 'Pilih 1 mahasiswa',
      }, { status: 400 })
    }

    // Can't vote for yourself
    if (votedForIds.includes(session.memberId)) {
      return NextResponse.json({ error: 'Tidak bisa memilih diri sendiri' }, { status: 400 })
    }

    // Get admin member IDs (to ensure no one votes for admin)
    const { data: admins } = await supabase
      .from('members')
      .select('id')
      .eq('is_admin', true)

    const adminIds = (admins || []).map((a) => a.id)

    // Can't vote for admin
    for (const votedId of votedForIds) {
      if (adminIds.includes(votedId)) {
        return NextResponse.json({ error: 'Tidak bisa memilih admin' }, { status: 400 })
      }
    }

    // Check existing votes
    const { data: existingVotes } = await supabase
      .from('active_student_votes')
      .select('id')
      .eq('agenda_id', agendaId)
      .eq('voter_id', session.memberId)

    const existingCount = existingVotes?.length || 0

    // For regular members: already voted = blocked
    if (!session.isAdmin && existingCount >= 1) {
      return NextResponse.json({ error: 'Anda sudah memberikan vote' }, { status: 409 })
    }

    // For admin: already voted with 2 = blocked
    if (session.isAdmin && existingCount >= 2) {
      return NextResponse.json({ error: 'Anda sudah memberikan vote' }, { status: 409 })
    }

    // Delete existing votes first (allows re-vote for admin)
    if (existingCount > 0) {
      const { error: deleteErr } = await supabase
        .from('active_student_votes')
        .delete()
        .eq('agenda_id', agendaId)
        .eq('voter_id', session.memberId)

      if (deleteErr) {
        return NextResponse.json({ error: 'Gagal menghapus vote lama' }, { status: 500 })
      }
    }

    // Insert new votes
    const inserts = votedForIds.map((votedId: string) => ({
      agenda_id: agendaId,
      voter_id: session.memberId,
      voted_for_id: votedId,
    }))

    const { error: insertErr } = await supabase.from('active_student_votes').insert(inserts)

    if (insertErr) {
      return NextResponse.json({ error: 'Gagal menyimpan vote' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
