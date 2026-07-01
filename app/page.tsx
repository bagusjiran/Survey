import supabase from '@/lib/supabase'
import LoginClient from './LoginClient'

// Force dynamic — always fetch fresh data (no caching)
export const dynamic = 'force-dynamic'

// Server Component — fetch members on server
export default async function LoginPage() {
  const { data: members } = await supabase
    .from('members')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  return <LoginClient members={members || []} />
}
