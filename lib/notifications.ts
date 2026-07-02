import supabase from './supabase'

export type NotificationType =
  | 'new_agenda'
  | 'deadline_reminder'
  | 'vote_result'
  | 'survey_reminder'
  | 'system'

export async function sendNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  agendaId?: string
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      agenda_id: agendaId || null,
      read: false,
    })
  } catch (err) {
    console.error('Send notification error:', err)
  }
}

export async function broadcastNotification(
  type: NotificationType,
  title: string,
  message: string,
  agendaId?: string
) {
  try {
    // Get all member IDs
    const { data: members } = await supabase
      .from('members')
      .select('id')

    if (!members) return

    const notifications = members.map(m => ({
      user_id: m.id,
      type,
      title,
      message,
      agenda_id: agendaId || null,
      read: false,
    }))

    await supabase.from('notifications').insert(notifications)
  } catch (err) {
    console.error('Broadcast notification error:', err)
  }
}
