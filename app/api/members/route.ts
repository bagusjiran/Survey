import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// Protected endpoint: returns id, full_name, nim for authenticated users
// Used by survey form (voting) and admin pages
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: members, error } = await supabase
    .from('members')
    .select('id, full_name, nim, is_admin')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  }

  return NextResponse.json({ members: members || [] })
}
