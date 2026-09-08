import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import AdminVerificationActions from '@/components/admin/AdminVerificationActions'
import { createClient } from '@/lib/supabase/server'
import type { VerificationDocumentType, VerificationStatus } from '@/types/database'

export type AdminVerificationRequest = {
  id: string
  legal_name: string
  document_type: VerificationDocumentType
  document_front_path: string | null
  document_back_path: string | null
  status: VerificationStatus
  review_note: string | null
  submitted_at: string
  reviewed_at: string | null
  provider: { display_name: string; slug: string; is_verified: boolean } | null
  profile: { email: string | null } | null
}

export default async function AdminVerificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/')

  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, legal_name, document_type, document_front_path, document_back_path, status, review_note, submitted_at, reviewed_at, provider:provider_profiles(display_name, slug, is_verified), profile:profiles!verification_requests_user_id_fkey(email)')
    .order('submitted_at', { ascending: false })
    .limit(100)

  if (error) throw new Error('Verification list unavailable')

  return (
    <AdminShell title="Verificación de identidades">
      <AdminVerificationActions initialRequests={(data ?? []) as unknown as AdminVerificationRequest[]} />
    </AdminShell>
  )
}
