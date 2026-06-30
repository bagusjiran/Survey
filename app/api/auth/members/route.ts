import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

// Public endpoint: returns member names for login dropdown
// No authentication required
export async function GET() {
  const { data: members, error } = await supabase
    .from('members')
    .select('id, full_name, nim, is_admin')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  }

  return NextResponse.json({ members: members || [] })
}
