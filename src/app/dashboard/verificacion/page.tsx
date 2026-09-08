import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'
import VerificationRequestForm from '@/components/dashboard/VerificationRequestForm'
import { createClient } from '@/lib/supabase/server'
import type { VerificationRequest } from '@/types/database'

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role === 'admin') redirect('/admin/verificaciones')

  const { data: provider, error: providerError } = await supabase
    .from('provider_profiles')
    .select('id, is_verified')
    .eq('user_id', user.id)
    .maybeSingle()

  if (providerError) throw new Error('Provider unavailable')

  const { data: verification, error: verificationError } = provider
    ? await supabase
        .from('verification_requests')
        .select('*')
        .eq('provider_id', provider.id)
        .maybeSingle()
    : { data: null, error: null }

  if (verificationError) throw new Error('Verification unavailable')

  return (
    <DashboardShell title="Confirmar mi identidad">
      <VerificationRequestForm
        hasProfile={Boolean(provider)}
        isVerified={Boolean(provider?.is_verified)}
        initialRequest={verification as VerificationRequest | null}
      />
    </DashboardShell>
  )
}
