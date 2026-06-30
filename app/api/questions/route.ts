import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agendaId = request.nextUrl.searchParams.get('agendaId')
  if (!agendaId) {
    return NextResponse.json({ error: 'agendaId diperlukan' }, { status: 400 })
  }

  const { data: questions, error } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('agenda_id', agendaId)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  return NextResponse.json({ questions })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agenda_id, question_text, question_type, options, sort_order } = await request.json()

    if (!agenda_id || !question_text) {
      return NextResponse.json({ error: 'agenda_id dan question_text harus diisi' }, { status: 400 })
    }

    const baseData: any = {
      agenda_id,
      question_text: question_text.trim(),
      question_type: question_type || 'text',
      sort_order: sort_order || 0,
    }

    // Try with options first (for radio type)
    let insertData = { ...baseData }
    if (question_type === 'radio' && options && Array.isArray(options) && options.length > 0) {
      insertData.options = options
    }

    let { data, error } = await supabase
      .from('survey_questions')
      .insert(insertData)
      .select()
      .single()

    // Fallback: if options column doesn't exist, retry without it
    if (error && error.message?.includes('options')) {
      console.warn('options column not found, retrying without it...')
      const fallback = await supabase
        .from('survey_questions')
        .insert(baseData)
        .select()
        .single()

      if (fallback.error) {
        return NextResponse.json({ error: 'Gagal menambah pertanyaan' }, { status: 500 })
      }
      data = fallback.data
      error = null
    }

    // Fallback: if radio type not in CHECK constraint, use text
    if (error && error.message?.includes('survey_questions_question_type_check')) {
      console.warn('radio type not in CHECK, retrying as text...')
      baseData.question_type = 'text'
      delete baseData.options
      const fallback = await supabase
        .from('survey_questions')
        .insert(baseData)
        .select()
        .single()

      if (fallback.error) {
        return NextResponse.json({ error: 'Gagal menambah pertanyaan' }, { status: 500 })
      }
      data = fallback.data
      error = null
    }

    if (error) {
      return NextResponse.json({ error: 'Gagal menambah pertanyaan' }, { status: 500 })
    }

    return NextResponse.json({ question: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 })
  }

  const { error } = await supabase.from('survey_questions').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Gagal menghapus pertanyaan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
