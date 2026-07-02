import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  const type = request.nextUrl.searchParams.get('type') // 'survey' | 'votes'

  if (!agendaId || !type) {
    return NextResponse.json({ error: 'agendaId dan type diperlukan' }, { status: 400 })
  }

  if (type === 'survey') {
    // Get survey responses with member info
    const { data: responses } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('agenda_id', agendaId)
      .order('created_at', { ascending: true })

    if (!responses || responses.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const memberIds = Array.from(new Set(responses.map(r => r.member_id)))
    const questionIds = Array.from(new Set(responses.map(r => r.question_id)))

    const [membersRes, questionsRes] = await Promise.all([
      supabase.from('members').select('id, full_name, nim').in('id', memberIds),
      supabase.from('survey_questions').select('id, question_text').in('id', questionIds),
    ])

    const memberMap = new Map((membersRes.data || []).map(m => [m.id, m]))
    const questionMap = new Map((questionsRes.data || []).map(q => [q.id, q]))

    const data = responses.map(r => ({
      nama: memberMap.get(r.member_id)?.full_name || '-',
      nim: memberMap.get(r.member_id)?.nim || '-',
      pertanyaan: questionMap.get(r.question_id)?.question_text || '-',
      jawaban: r.response_text || '-',
      waktu: new Date(r.created_at).toLocaleString('id-ID'),
    }))

    return NextResponse.json({ data })
  }

  if (type === 'votes') {
    // Get vote details
    const { data: votes } = await supabase
      .from('active_student_votes')
      .select('voter_id, voted_for_id, created_at')
      .eq('agenda_id', agendaId)
      .order('created_at', { ascending: true })

    if (!votes || votes.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const allIds = Array.from(new Set(votes.flatMap(v => [v.voter_id, v.voted_for_id])))
    const { data: members } = await supabase
      .from('members')
      .select('id, full_name, nim')
      .in('id', allIds)

    const memberMap = new Map((members || []).map(m => [m.id, m]))

    const data = votes.map(v => ({
      pemilih: memberMap.get(v.voter_id)?.full_name || '-',
      nim_pemilih: memberMap.get(v.voter_id)?.nim || '-',
      dipilih: memberMap.get(v.voted_for_id)?.full_name || '-',
      nim_dipilih: memberMap.get(v.voted_for_id)?.nim || '-',
      waktu: new Date(v.created_at).toLocaleString('id-ID'),
    }))

    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Type tidak valid' }, { status: 400 })
}
