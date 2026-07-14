import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'
import LeadPipeline, { type DashboardLead } from '@/components/dashboard/LeadPipeline'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardContactosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>
}) {
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'admin') redirect('/admin')

  const { data: providerProfile } = await supabase
    .from('provider_profiles')
    .select('id, display_name, slug, is_approved')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: leads } = providerProfile
    ? await supabase
        .from('leads')
        .select('id, message, source, status, created_at, updated_at')
        .eq('provider_id', providerProfile.id)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  const leadRows = (leads ?? []) as DashboardLead[]
  const newLeadCount = leadRows.filter((lead) => lead.status === 'new').length

  return (
    <DashboardShell title="Personas interesadas en tu trabajo" newLeadCount={newLeadCount}>
      <div className="space-y-6">
        {!providerProfile ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <h2 className="font-semibold text-gray-900 mb-2">Primero crea tu perfil de trabajo</h2>
            <p className="text-sm text-gray-600 mb-4">Cuando una persona quiera hablar contigo por WhatsApp, aparecerá aquí.</p>
            <Link
              href="/dashboard/perfil"
              className="inline-flex px-5 py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors"
            >
              Crear mi perfil de trabajo
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">Personas que quisieron contactarte</h2>
                  <p className="text-sm text-gray-500">{providerProfile.display_name}</p>
                </div>
                {providerProfile.is_approved && (
                  <Link
                    href={`/proveedores/${providerProfile.slug}`}
                    target="_blank"
                    className="text-sm font-semibold text-teal-700 hover:underline"
                  >
                    Ver perfil
                  </Link>
                )}
              </div>

              <div className="p-5">
                <LeadPipeline
                  initialLeads={leadRows}
                  initialFilter={query.filter === 'new' ? 'new' : 'all'}
                  referenceTime={new Date().toISOString()}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
