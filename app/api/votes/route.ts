import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// Chairman NIM — excluded from voting
const CHAIRMAN_NIM = '24550011'

// Get vote results — ALL authenticated users can see
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  if (!agendaId) {
    return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
  }

  const { data: votes, error } = await supabase
    .from('active_student_votes')
    .select('voted_for_id')
    .eq('agenda_id', agendaId)

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  const voteCounts: Record<string, number> = {}
  for (const vote of votes || []) {
    voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1
  }

  const candidateIds = Object.keys(voteCounts)
  if (candidateIds.length === 0) {
    return NextResponse.json({ results: [], totalVotes: 0 })
  }

  // Only admin can see NIM in vote results
  let members: any[] = []
  if (session.isAdmin) {
    const { data } = await supabase.from('members').select('id, full_name, nim').in('id', candidateIds)
    members = data || []
  } else {
    const { data } = await supabase.from('members').select('id, full_name').in('id', candidateIds)
    members = data || []
  }

  const results = members
    .map((m: any) => ({
      voted_for_id: m.id,
      full_name: m.full_name,
      ...(session.isAdmin ? { nim: m.nim } : {}),
      vote_count: voteCounts[m.id] || 0,
    }))
    .sort((a, b) => b.vote_count - a.vote_count)

  return NextResponse.json({ results, totalVotes: (votes || []).length })
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

    // Validate agendaId format (UUID)
    if (typeof agendaId !== 'string' || agendaId.length > 100) {
      return NextResponse.json({ error: 'agendaId tidak valid' }, { status: 400 })
    }

    const maxVotes = session.isAdmin ? 2 : 1
    if (votedForIds.length === 0 || votedForIds.length > maxVotes) {
      return NextResponse.json({
        error: session.isAdmin ? 'Admin bisa memilih 1-2 mahasiswa' : 'Pilih 1 mahasiswa',
      }, { status: 400 })
    }

    // Validate each votedForId
    for (const id of votedForIds) {
      if (typeof id !== 'string' || id.length > 100) {
        return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
      }
    }

    // Can't vote for yourself
    if (votedForIds.includes(session.memberId)) {
      return NextResponse.json({ error: 'Tidak bisa memilih diri sendiri' }, { status: 400 })
    }

    // Get chairman member ID (only chairman excluded from being voted)
    const { data: chairman } = await supabase
      .from('members')
      .select('id')
      .eq('nim', CHAIRMAN_NIM)
      .single()

    const chairmanId = chairman?.id

    // Can't vote for chairman (ketua)
    for (const votedId of votedForIds) {
      if (chairmanId && votedId === chairmanId) {
        return NextResponse.json({ error: 'Tidak bisa memilih ketua' }, { status: 400 })
      }
    }

    // Check existing votes
    const { data: existingVotes } = await supabase
      .from('active_student_votes')
      .select('id')
      .eq('agenda_id', agendaId)
      .eq('voter_id', session.memberId)

    const existingCount = existingVotes?.length || 0

    if (!session.isAdmin && existingCount >= 1) {
      return NextResponse.json({ error: 'Anda sudah memberikan vote' }, { status: 409 })
    }

    if (session.isAdmin && existingCount >= 2) {
      return NextResponse.json({ error: 'Anda sudah memberikan vote' }, { status: 409 })
    }

    // Delete existing votes before re-inserting (for admin who can change vote)
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

    const inserts = votedForIds.map((votedId: string) => ({
      agenda_id: agendaId,
      voter_id: session.memberId,
      voted_for_id: votedId,
    }))

    const { error: insertErr } = await supabase.from('active_student_votes').insert(inserts)

    if (insertErr) {
      // Check for unique constraint violation (race condition protection)
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'Anda sudah memberikan vote' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Gagal menyimpan vote' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
