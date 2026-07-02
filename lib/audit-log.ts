import supabase from './supabase'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create_agenda'
  | 'update_agenda'
  | 'delete_agenda'
  | 'create_question'
  | 'update_question'
  | 'delete_question'
  | 'submit_survey'
  | 'edit_survey'
  | 'submit_vote'
  | 'edit_vote'
  | 'export_pdf'
  | 'export_excel'

export async function logAudit(
  userId: string,
  userName: string,
  action: AuditAction,
  details: string,
  agendaId?: string
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_name: userName,
      action,
      details,
      agenda_id: agendaId || null,
    })
  } catch (err) {
    // Don't fail the main operation if audit log fails
    console.error('Audit log error:', err)
  }
}
