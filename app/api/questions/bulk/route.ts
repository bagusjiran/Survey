import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// POST: Bulk delete questions
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs pertanyaan harus diisi' }, { status: 400 })
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('survey_questions')
        .delete()
        .in('id', ids)

      if (error) {
        return NextResponse.json({ error: 'Gagal menghapus pertanyaan' }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: ids.length })
    }

    if (action === 'reorder') {
      // Reorder questions: ids array should be in desired order
      for (let i = 0; i < ids.length; i++) {
        await supabase
          .from('survey_questions')
          .update({ sort_order: i })
          .eq('id', ids[i])
      }

      return NextResponse.json({ success: true, reordered: ids.length })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
