import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { createClient } from '@/lib/supabase/server'

type AdminLead = {
  id: string
  message: string | null
  source: string | null
  created_at: string
  provider: {
    display_name: string | null
    slug: string | null
    whatsapp: string | null
    category: { name: string | null } | null
    city: { name: string | null } | null
  } | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(value))
}

function isWithinDays(value: string, days: number) {
  const date = new Date(value).getTime()
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  return date >= since
}

export default async function AdminContactosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/')

  const { data: leads } = await supabase
    .from('leads')
    .select('id, message, source, created_at, provider:provider_profiles(display_name, slug, whatsapp, category:categories(name), city:cities(name))')
    .order('created_at', { ascending: false })
    .limit(200)

  const leadRows = (leads ?? []) as AdminLead[]
  const total = leadRows.length
  const lastSevenDays = leadRows.filter((lead) => isWithinDays(lead.created_at, 7)).length
  const uniqueProviders = new Set(leadRows.map((lead) => lead.provider?.slug).filter(Boolean)).size

  return (
    <AdminShell title="Leads y contactos">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-sm text-gray-500 mb-1">Contactos registrados</div>
            <div className="text-3xl font-bold text-gray-900">{total}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-sm text-gray-500 mb-1">Últimos 7 días</div>
            <div className="text-3xl font-bold text-gray-900">{lastSevenDays}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-sm text-gray-500 mb-1">Proveedores contactados</div>
            <div className="text-3xl font-bold text-gray-900">{uniqueProviders}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Historial reciente</h2>
            <p className="text-sm text-gray-500">Clicks reales al botón de WhatsApp en perfiles públicos.</p>
          </div>

          {leadRows.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {leadRows.map((lead) => (
                <div key={lead.id} className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {lead.provider?.display_name ?? 'Proveedor eliminado'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {[lead.provider?.category?.name, lead.provider?.city?.name].filter(Boolean).join(' · ') || 'Sin categoría'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(lead.created_at)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-semibold">
                      {lead.source ?? 'whatsapp'}
                    </span>
                    {lead.provider?.whatsapp && (
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {lead.provider.whatsapp}
                      </span>
                    )}
                  </div>
                  {lead.message && (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{lead.message}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Aún no hay contactos registrados.</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
