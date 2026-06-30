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
    console.error('Questions fetch error:', error)
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

    const insertData: any = {
      agenda_id,
      question_text: question_text.trim(),
      question_type: question_type || 'text',
      sort_order: sort_order || 0,
    }

    // Only include options if question_type is 'radio' and options provided
    if (question_type === 'radio' && options && Array.isArray(options) && options.length > 0) {
      insertData.options = options
    }

    const { data, error } = await supabase
      .from('survey_questions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Question insert error:', JSON.stringify(error, null, 2))
      return NextResponse.json({
        error: 'Gagal menambah pertanyaan',
        details: error.message || 'Unknown error',
      }, { status: 500 })
    }

    return NextResponse.json({ question: data }, { status: 201 })
  } catch (err: any) {
    console.error('Question POST exception:', err)
    return NextResponse.json({ error: 'Data tidak valid', details: err.message }, { status: 400 })
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
    console.error('Question delete error:', error)
    return NextResponse.json({ error: 'Gagal menghapus pertanyaan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
