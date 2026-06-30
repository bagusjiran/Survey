import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: Fetch all responses for an agenda (admin only)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  if (!agendaId) {
    return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
  }

  // Get all responses with member and question info
  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select(`
      id,
      response_text,
      created_at,
      member_id,
      question_id,
      members!inner ( full_name, nim ),
      survey_questions!inner ( question_text, question_type, sort_order )
    `)
    .eq('agenda_id', agendaId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Responses fetch error:', error)
    // Fallback: fetch without joins
    const { data: simpleResponses, error: simpleError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('agenda_id', agendaId)
      .order('created_at', { ascending: true })

    if (simpleError) {
      return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
    }

    // Get member and question info separately
    const memberIds = Array.from(new Set((simpleResponses || []).map((r: any) => r.member_id)))
    const questionIds = Array.from(new Set((simpleResponses || []).map((r: any) => r.question_id)))

    const [membersData, questionsData] = await Promise.all([
      memberIds.length > 0
        ? supabase.from('members').select('id, full_name, nim').in('id', memberIds)
        : { data: [] },
      questionIds.length > 0
        ? supabase.from('survey_questions').select('id, question_text, question_type, sort_order').in('id', questionIds)
        : { data: [] },
    ])

    const membersMap = new Map((membersData.data || []).map((m: any) => [m.id, m]))
    const questionsMap = new Map((questionsData.data || []).map((q: any) => [q.id, q]))

    const enriched = (simpleResponses || []).map((r: any) => ({
      ...r,
      member: membersMap.get(r.member_id) || { full_name: 'Unknown', nim: '---' },
      question: questionsMap.get(r.question_id) || { question_text: 'Unknown', question_type: 'text', sort_order: 0 },
    }))

    return NextResponse.json({ responses: enriched })
  }

  // Transform joined data
  const transformed = (responses || []).map((r: any) => ({
    id: r.id,
    response_text: r.response_text,
    created_at: r.created_at,
    member_id: r.member_id,
    question_id: r.question_id,
    member: r.members || { full_name: 'Unknown', nim: '---' },
    question: r.survey_questions || { question_text: 'Unknown', question_type: 'text', sort_order: 0 },
  }))

  return NextResponse.json({ responses: transformed })
}
