import supabase from '@/lib/supabase'
import LoginClient from './LoginClient'

// Server Component — fetch members on server, no client fetch needed
export default async function LoginPage() {
  const { data: members } = await supabase
    .from('members')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  return <LoginClient members={members || []} />
}
