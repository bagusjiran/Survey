import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// Check if already submitted (check VOTE first, since vote is mandatory)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  if (!agendaId) {
    return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
  }

  // Check if already voted for this agenda (vote is mandatory)
  const { data: voteData, error: voteErr } = await supabase
    .from('active_student_votes')
    .select('id')
    .eq('agenda_id', agendaId)
    .eq('voter_id', session.memberId)
    .limit(1)

  if (voteErr) {
    return NextResponse.json({ error: 'Gagal memeriksa' }, { status: 500 })
  }

  const alreadyVoted = voteData && voteData.length > 0

  // Also check survey responses (for display purposes)
  const { data: surveyData } = await supabase
    .from('survey_responses')
    .select('id')
    .eq('agenda_id', agendaId)
    .eq('member_id', session.memberId)
    .limit(1)

  const alreadySubmittedSurvey = surveyData && surveyData.length > 0

  // Already submitted = already voted (vote is the mandatory part)
  return NextResponse.json({
    alreadySubmitted: alreadyVoted,
    alreadyVoted,
    alreadySubmittedSurvey,
  })
}

// Submit survey responses (only if questions exist)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agendaId, responses } = await request.json()

    if (!agendaId) {
      return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
    }

    // If no responses provided or empty array, skip (no questions for this agenda)
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 })
    }

    // Check if already submitted survey for this agenda
    const { data: existing } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('agenda_id', agendaId)
      .eq('member_id', session.memberId)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Anda sudah mengisi survey ini' }, { status: 409 })
    }

    // Insert all responses
    const inserts = responses.map((r: any) => ({
      agenda_id: agendaId,
      question_id: r.questionId,
      member_id: session.memberId,
      response_text: r.responseText,
    }))

    const { error } = await supabase.from('survey_responses').insert(inserts)

    if (error) {
      return NextResponse.json({ error: 'Gagal menyimpan jawaban' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
