import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// Time limit for editing answers (in milliseconds)
const EDIT_TIME_LIMIT_MS = 60 * 60 * 1000 // 1 hour

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
    .select('id, created_at')
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
    .select('id, created_at')
    .eq('agenda_id', agendaId)
    .eq('member_id', session.memberId)
    .limit(1)

  const alreadySubmittedSurvey = surveyData && surveyData.length > 0

  // Check if editing is still allowed (within 1 hour)
  let canEdit = false
  let editDeadline: string | null = null

  if (alreadyVoted && voteData[0].created_at) {
    const submittedAt = new Date(voteData[0].created_at).getTime()
    const now = Date.now()
    canEdit = (now - submittedAt) < EDIT_TIME_LIMIT_MS
    editDeadline = new Date(submittedAt + EDIT_TIME_LIMIT_MS).toISOString()
  }

  return NextResponse.json({
    alreadySubmitted: alreadyVoted,
    alreadyVoted,
    alreadySubmittedSurvey,
    canEdit,
    editDeadline,
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

// PATCH: Edit survey responses (member, within 1 hour)
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agendaId, responses } = await request.json()

    if (!agendaId) {
      return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: 'Data jawaban kosong' }, { status: 400 })
    }

    // Check time limit — get earliest response created_at
    const { data: existingResponses } = await supabase
      .from('survey_responses')
      .select('created_at')
      .eq('agenda_id', agendaId)
      .eq('member_id', session.memberId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (!existingResponses || existingResponses.length === 0) {
      return NextResponse.json({ error: 'Anda belum mengisi survey ini' }, { status: 404 })
    }

    const submittedAt = new Date(existingResponses[0].created_at).getTime()
    const now = Date.now()
    if (now - submittedAt >= EDIT_TIME_LIMIT_MS) {
      return NextResponse.json({
        error: 'Batas waktu edit telah habis (1 jam setelah pengisian)',
      }, { status: 403 })
    }

    // Update each response
    for (const r of responses) {
      if (!r.questionId) continue
      const { error } = await supabase
        .from('survey_responses')
        .update({ response_text: r.responseText })
        .eq('agenda_id', agendaId)
        .eq('question_id', r.questionId)
        .eq('member_id', session.memberId)

      if (error) {
        return NextResponse.json({ error: 'Gagal mengupdate jawaban' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
