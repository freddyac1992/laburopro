import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { createClient } from '@/lib/supabase/server'

type ProviderDashboardProfile = {
  id: string
  display_name: string
  slug: string
  zone: string | null
  description: string | null
  services: string[] | null
  years_experience: number | null
  price_reference: string | null
  whatsapp: string | null
  availability: string | null
  is_approved: boolean
  is_verified: boolean
  is_active: boolean
  rating: number
  review_count: number
  category: { name: string | null } | null
  city: { name: string | null } | null
}

type DashboardLead = {
  id: string
  created_at: string
  source: string | null
}

function isWithinDays(value: string, days: number) {
  const date = new Date(value).getTime()
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  return date >= since
}

function isToday(value: string) {
  const now = new Date()
  const date = new Date(value)
  return date.toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' }) === now.toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' })
}

function getProfileChecklist(providerProfile: ProviderDashboardProfile) {
  return [
    {
      label: 'WhatsApp configurado',
      done: Boolean(providerProfile.whatsapp),
      hint: 'Es obligatorio para recibir contactos.',
    },
    {
      label: 'Categoría y ciudad',
      done: Boolean(providerProfile.category?.name && providerProfile.city?.name),
      hint: 'Ayuda a aparecer en búsquedas relevantes.',
    },
    {
      label: 'Descripción clara',
      done: Boolean(providerProfile.description && providerProfile.description.length >= 80),
      hint: 'Explica qué haces, cómo trabajas y qué zonas atiendes.',
    },
    {
      label: 'Servicios específicos',
      done: Boolean(providerProfile.services && providerProfile.services.length >= 3),
      hint: 'Lista al menos 3 servicios concretos.',
    },
    {
      label: 'Precio o referencia',
      done: Boolean(providerProfile.price_reference),
      hint: 'Una referencia reduce dudas antes del contacto.',
    },
    {
      label: 'Disponibilidad',
      done: Boolean(providerProfile.availability),
      hint: 'Indica horarios o días de atención.',
    },
  ]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle())

  if (profile?.role === 'admin') redirect('/admin')

  const { data: providerProfile } = (await supabase
    .from('provider_profiles')
    .select('id, display_name, slug, zone, description, services, years_experience, price_reference, whatsapp, availability, is_approved, is_verified, is_active, rating, review_count, category:categories(name), city:cities(name)')
    .eq('user_id', user.id)
    .maybeSingle()) as { data: ProviderDashboardProfile | null }

  const { data: leads } = providerProfile
    ? await supabase
        .from('leads')
        .select('id, created_at, source')
        .eq('provider_id', providerProfile.id)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  const leadRows = (leads ?? []) as DashboardLead[]
  const leadCount = leadRows.length
  const leadsToday = leadRows.filter((lead) => isToday(lead.created_at)).length
  const leadsLastSevenDays = leadRows.filter((lead) => isWithinDays(lead.created_at, 7)).length
  const leadsLastThirtyDays = leadRows.filter((lead) => isWithinDays(lead.created_at, 30)).length
  const checklist = providerProfile ? getProfileChecklist(providerProfile) : []
  const completedChecklist = checklist.filter((item) => item.done).length
  const completionPercent = checklist.length > 0 ? Math.round((completedChecklist / checklist.length) * 100) : 0

  return (
    <DashboardShell title={`Hola, ${profile?.full_name ?? 'Proveedor'} 👋`}>
      <div className="space-y-6">
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Estado de tu perfil</h2>
          {providerProfile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Perfil creado</span>
                <span className="text-green-600 font-semibold text-sm">✅ Sí</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aprobado por el equipo</span>
                <span className={`font-semibold text-sm ${providerProfile.is_approved ? 'text-green-600' : 'text-amber-600'}`}>
                  {providerProfile.is_approved ? '✅ Aprobado' : '⏳ Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verificado</span>
                <span className={`font-semibold text-sm ${providerProfile.is_verified ? 'text-green-600' : 'text-gray-400'}`}>
                  {providerProfile.is_verified ? '✅ Verificado' : '— No verificado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Contactos recibidos</span>
                <span className="font-semibold text-sm text-blue-700">{leadCount ?? 0}</span>
              </div>
              {!providerProfile.is_approved && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  Tu perfil está pendiente de revisión. Nuestro equipo lo aprobará pronto.
                </div>
              )}
              {providerProfile.is_approved && (
                <div className="mt-3">
                  <Link
                    href={`/proveedores/${providerProfile.slug}`}
                    className="text-sm text-blue-700 hover:underline font-medium"
                    target="_blank"
                    id="dashboard-view-profile-link"
                  >
                    Ver mi perfil público →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4 text-sm">
                Aún no has creado tu perfil de proveedor.
              </p>
              <Link
                href="/dashboard/perfil"
                id="dashboard-create-profile-btn"
                className="inline-block px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                Crear mi perfil
              </Link>
            </div>
          )}
        </div>

        {providerProfile && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/dashboard/contactos"
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="text-sm text-gray-500 mb-1">Contactos totales</div>
                <div className="text-3xl font-bold text-gray-900">{leadCount}</div>
              </Link>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-sm text-gray-500 mb-1">Hoy</div>
                <div className="text-3xl font-bold text-gray-900">{leadsToday}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-sm text-gray-500 mb-1">Últimos 7 días</div>
                <div className="text-3xl font-bold text-gray-900">{leadsLastSevenDays}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-sm text-gray-500 mb-1">Últimos 30 días</div>
                <div className="text-3xl font-bold text-gray-900">{leadsLastThirtyDays}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="font-semibold text-gray-900">Salud del perfil</h2>
                    <p className="text-sm text-gray-500">Mientras más completo, mejor convierte.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{completionPercent}%</div>
                    <div className="text-xs text-gray-500">{completedChecklist}/{checklist.length}</div>
                  </div>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-blue-700 rounded-full"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.done ? '✓' : '!'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        {!item.done && <p className="text-xs text-gray-500">{item.hint}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/dashboard/perfil"
                  className="mt-5 inline-flex px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                >
                  Mejorar perfil
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Resumen público</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Servicio</span>
                    <span className="font-medium text-gray-900 text-right">{providerProfile.category?.name ?? 'Sin categoría'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Ciudad</span>
                    <span className="font-medium text-gray-900 text-right">{providerProfile.city?.name ?? 'Sin ciudad'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Calificación</span>
                    <span className="font-medium text-gray-900 text-right">
                      {providerProfile.rating > 0
                        ? `${providerProfile.rating.toFixed(1)} (${providerProfile.review_count})`
                        : 'Sin reseñas'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Experiencia</span>
                    <span className="font-medium text-gray-900 text-right">
                      {providerProfile.years_experience
                        ? `${providerProfile.years_experience} año${providerProfile.years_experience !== 1 ? 's' : ''}`
                        : 'Sin dato'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Estado comercial</span>
                    <span className={`font-semibold text-right ${
                      providerProfile.is_approved && providerProfile.is_active ? 'text-green-700' : 'text-amber-700'
                    }`}>
                      {providerProfile.is_approved && providerProfile.is_active ? 'Visible al público' : 'No visible aún'}
                    </span>
                  </div>
                </div>

                {providerProfile.is_approved ? (
                  <Link
                    href={`/proveedores/${providerProfile.slug}`}
                    target="_blank"
                    className="mt-5 inline-flex px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    Ver como cliente
                  </Link>
                ) : (
                  <p className="mt-5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Tu perfil empezará a recibir contactos cuando sea aprobado por el equipo.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/perfil"
            id="dashboard-edit-profile-card"
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">👤</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {providerProfile ? 'Editar perfil' : 'Crear perfil'}
            </h3>
            <p className="text-gray-500 text-sm">Completa o actualiza tu información de proveedor.</p>
          </Link>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="font-semibold text-gray-900 mb-1">Reseñas</h3>
            <p className="text-gray-500 text-sm">Los clientes ya pueden dejar reseñas públicas moderadas en tu perfil.</p>
          </div>

          <Link
            href="/dashboard/contactos"
            id="dashboard-contacts-card"
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">📲</div>
            <h3 className="font-semibold text-gray-900 mb-1">Contactos</h3>
            <p className="text-gray-500 text-sm">
              {providerProfile
                ? `${leadCount ?? 0} persona${leadCount === 1 ? '' : 's'} hicieron click para contactarte por WhatsApp.`
                : 'Crea tu perfil para empezar a recibir contactos.'}
            </p>
          </Link>
        </div>
      </div>
    </DashboardShell>
  )
}
