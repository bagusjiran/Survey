import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

// Public endpoint: returns ONLY id and name for login dropdown
// NIM and is_admin are NOT exposed for security
export async function GET() {
  const { data: members, error } = await supabase
    .from('members')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  }

  return NextResponse.json({ members: members || [] })
}
