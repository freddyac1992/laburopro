import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { createClient } from '@/lib/supabase/server'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(value))
}

function isToday(value: string) {
  const now = new Date()
  const date = new Date(value)
  return date.toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' }) === now.toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' })
}

function isWithinDays(value: string, days: number) {
  const date = new Date(value).getTime()
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  return date >= since
}

export default async function DashboardContactosPage() {
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
        .select('id, message, source, created_at')
        .eq('provider_id', providerProfile.id)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  const leadRows = leads ?? []
  const total = leadRows.length
  const today = leadRows.filter((lead) => isToday(lead.created_at)).length
  const lastSevenDays = leadRows.filter((lead) => isWithinDays(lead.created_at, 7)).length

  return (
    <DashboardShell title="Contactos recibidos">
      <div className="space-y-6">
        {!providerProfile ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <h2 className="font-semibold text-gray-900 mb-2">Crea tu perfil para empezar a recibir contactos</h2>
            <p className="text-sm text-gray-500 mb-4">Cuando alguien toque el botón de WhatsApp en tu perfil, aparecerá aquí.</p>
            <Link
              href="/dashboard/perfil"
              className="inline-flex px-5 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
            >
              Crear mi perfil
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-sm text-gray-500 mb-1">Total</div>
                <div className="text-3xl font-bold text-gray-900">{total}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-sm text-gray-500 mb-1">Hoy</div>
                <div className="text-3xl font-bold text-gray-900">{today}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-sm text-gray-500 mb-1">Últimos 7 días</div>
                <div className="text-3xl font-bold text-gray-900">{lastSevenDays}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">Historial de contactos</h2>
                  <p className="text-sm text-gray-500">{providerProfile.display_name}</p>
                </div>
                {providerProfile.is_approved && (
                  <Link
                    href={`/proveedores/${providerProfile.slug}`}
                    target="_blank"
                    className="text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Ver perfil
                  </Link>
                )}
              </div>

              {leadRows.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {leadRows.map((lead) => (
                    <div key={lead.id} className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <span className="font-semibold text-gray-900">Click a WhatsApp</span>
                        <span className="text-sm text-gray-500">{formatDate(lead.created_at)}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">Origen: {lead.source ?? 'whatsapp'}</div>
                      {lead.message && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{lead.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">Todavía no tienes contactos registrados.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
