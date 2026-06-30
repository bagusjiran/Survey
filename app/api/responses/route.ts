import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: Fetch all responses for an agenda
// Admin: sees member names
// Member: sees anonymous responses (no names)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  const forceMemberView = request.nextUrl.searchParams.get('view') === 'member'
  if (!agendaId) {
    return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
  }

  const isAdmin = session.isAdmin

  // Get all responses
  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('agenda_id', agendaId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  if (!responses || responses.length === 0) {
    return NextResponse.json({ responses: [], totalResponden: 0 })
  }

  // Get question info
  const questionIds = Array.from(new Set(responses.map((r) => r.question_id)))
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('id, question_text, question_type, sort_order')
    .in('id', questionIds)

  const questionsMap = new Map((questions || []).map((q) => [q.id, q]))

  // If admin: also get member info
  let membersMap = new Map()
  if (isAdmin) {
    const memberIds = Array.from(new Set(responses.map((r) => r.member_id)))
    const { data: members } = await supabase
      .from('members')
      .select('id, full_name, nim')
      .in('id', memberIds)
    membersMap = new Map((members || []).map((m) => [m.id, m]))
  }

  // Group responses by member (for admin) or by question (for members)
  if (isAdmin && !forceMemberView) {
    // Admin: group by member with names
    const grouped: Record<string, { member: any; answers: any[] }> = {}
    responses.forEach((r) => {
      if (!grouped[r.member_id]) {
        grouped[r.member_id] = {
          member: membersMap.get(r.member_id) || { full_name: 'Unknown', nim: '---' },
          answers: [],
        }
      }
      grouped[r.member_id].answers.push({
        id: r.id,
        response_text: r.response_text,
        question: questionsMap.get(r.question_id) || { question_text: 'Unknown', question_type: 'text' },
      })
    })

    return NextResponse.json({
      responses: Object.values(grouped),
      totalResponden: Object.keys(grouped).length,
      isAdmin: true,
    })
  } else {
    // Members: group by question, anonymized
    const grouped: Record<string, { question: any; answers: string[] }> = {}
    responses.forEach((r) => {
      if (!grouped[r.question_id]) {
        grouped[r.question_id] = {
          question: questionsMap.get(r.question_id) || { question_text: 'Unknown', question_type: 'text' },
          answers: [],
        }
      }
      if (r.response_text) {
        grouped[r.question_id].answers.push(r.response_text)
      }
    })

    const totalResponden = new Set(responses.map((r) => r.member_id)).size

    return NextResponse.json({
      responses: Object.values(grouped),
      totalResponden,
      isAdmin: false,
    })
  }
}
