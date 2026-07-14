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
  profile_photo_path: string | null
  work_photo_path: string | null
  is_approved: boolean
  is_verified: boolean
  is_active: boolean
  rating: number
  review_count: number
  category: { name: string | null } | null
  city: { name: string | null } | null
}

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function startOfTodayInLaPaz() {
  const localDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' })
  return new Date(`${localDate}T00:00:00-04:00`).toISOString()
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
    {
      label: 'Fotos del perfil',
      done: Boolean(providerProfile.profile_photo_path && providerProfile.work_photo_path),
      hint: 'Añade tu foto y una muestra de un trabajo realizado.',
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
    .select('id, display_name, slug, zone, description, services, years_experience, price_reference, whatsapp, availability, profile_photo_path, work_photo_path, is_approved, is_verified, is_active, rating, review_count, category:categories(name), city:cities(name)')
    .eq('user_id', user.id)
    .maybeSingle()) as { data: ProviderDashboardProfile | null }

  const analytics = providerProfile
    ? await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).gte('created_at', startOfTodayInLaPaz()),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).gte('created_at', since(7)),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).gte('created_at', since(30)),
        supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id),
        supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).gte('created_at', startOfTodayInLaPaz()),
        supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).gte('created_at', since(7)),
        supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).gte('created_at', since(30)),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).eq('status', 'new'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerProfile.id).eq('status', 'new').lt('created_at', since(1)),
      ])
    : []

  const leadCount = analytics[0]?.count ?? 0
  const leadsToday = analytics[1]?.count ?? 0
  const leadsLastSevenDays = analytics[2]?.count ?? 0
  const leadsLastThirtyDays = analytics[3]?.count ?? 0
  const profileViews = analytics[4]?.count ?? 0
  const profileViewsToday = analytics[5]?.count ?? 0
  const profileViewsLastSevenDays = analytics[6]?.count ?? 0
  const profileViewsLastThirtyDays = analytics[7]?.count ?? 0
  const newLeadCount = analytics[8]?.count ?? 0
  const staleLeadCount = analytics[9]?.count ?? 0
  const conversionLastThirtyDays = profileViewsLastThirtyDays > 0
    ? Math.round((leadsLastThirtyDays / profileViewsLastThirtyDays) * 100)
    : 0
  const checklist = providerProfile ? getProfileChecklist(providerProfile) : []
  const completedChecklist = checklist.filter((item) => item.done).length
  const completionPercent = checklist.length > 0 ? Math.round((completedChecklist / checklist.length) * 100) : 0

  return (
    <DashboardShell title={`Hola, ${profile?.full_name ?? 'trabajador'}`} newLeadCount={newLeadCount}>
      <div className="space-y-6">
        {providerProfile && newLeadCount > 0 && (
          <Link
            href="/dashboard/contactos?filter=new"
            className={`block rounded-lg border p-5 ${
              staleLeadCount > 0
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {newLeadCount === 1 ? 'Una persona espera tu respuesta' : `${newLeadCount} personas esperan tu respuesta`}
                </p>
                <p className="text-sm mt-1 opacity-80">
                  {staleLeadCount > 0
                    ? `${staleLeadCount} lleva${staleLeadCount === 1 ? '' : 'n'} más de 24 horas esperando seguimiento.`
                    : 'Responder pronto aumenta las posibilidades de concretar el trabajo.'}
                </p>
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">Ver quién escribió</span>
            </div>
          </Link>
        )}
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Lo más importante</h2>
          {providerProfile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tu información está guardada</span>
                <span className="text-green-700 font-semibold text-sm">Sí</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revisión de LaburoPro</span>
                <span className={`font-semibold text-sm ${providerProfile.is_approved ? 'text-green-600' : 'text-amber-600'}`}>
                  {providerProfile.is_approved ? 'Listo' : 'Estamos revisando'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Identidad confirmada</span>
                <span className={`font-semibold text-sm ${providerProfile.is_verified ? 'text-green-600' : 'text-gray-400'}`}>
                  {providerProfile.is_verified ? 'Sí' : 'Todavía no'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Personas interesadas</span>
                <span className="font-semibold text-sm text-teal-700">{leadCount ?? 0}</span>
              </div>
              {!providerProfile.is_approved && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  Estamos revisando tu perfil. Te mostraremos públicamente cuando esté listo.
                </div>
              )}
              {providerProfile.is_approved && (
                <div className="mt-3">
                  <Link
                    href={`/proveedores/${providerProfile.slug}`}
                    className="text-sm text-teal-700 hover:underline font-medium"
                    target="_blank"
                    id="dashboard-view-profile-link"
                  >
                    Ver mi perfil como lo ven los clientes
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4 text-sm">
                Todavía no mostraste qué trabajo realizas.
              </p>
              <Link
                href="/dashboard/perfil"
                id="dashboard-create-profile-btn"
                className="inline-block px-6 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 transition-colors"
              >
                Crear mi perfil de trabajo
              </Link>
            </div>
          )}
        </div>

        {providerProfile && (
          <>
            <div>
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">Personas que vieron tu perfil</h2>
                  <p className="text-sm text-gray-500">Cada visita es una persona que quiso conocer tu trabajo.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-teal-700">{conversionLastThirtyDays}%</div>
                  <div className="text-xs text-gray-500">de cada 100 visitas escribieron</div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">Visitas totales</div>
                  <div className="text-3xl font-bold text-gray-900">{profileViews}</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">Hoy</div>
                  <div className="text-3xl font-bold text-gray-900">{profileViewsToday}</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">Últimos 7 días</div>
                  <div className="text-3xl font-bold text-gray-900">{profileViewsLastSevenDays}</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">Últimos 30 días</div>
                  <div className="text-3xl font-bold text-gray-900">{profileViewsLastThirtyDays}</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Personas que tocaron tu WhatsApp</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/dashboard/contactos"
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all"
              >
                <div className="text-sm text-gray-500 mb-1">En total</div>
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="font-semibold text-gray-900">Completa tu información</h2>
                    <p className="text-sm text-gray-500">Más información ayuda a que confíen en tu trabajo.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{completionPercent}%</div>
                    <div className="text-xs text-gray-500">{completedChecklist}/{checklist.length}</div>
                  </div>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-teal-700 rounded-full"
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
                  className="mt-5 inline-flex px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors"
                >
                  Completar mi información
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
                    className="mt-5 inline-flex px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-teal-300 hover:text-teal-700 transition-colors"
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
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all"
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
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">📲</div>
            <h3 className="font-semibold text-gray-900 mb-1">Personas interesadas</h3>
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
