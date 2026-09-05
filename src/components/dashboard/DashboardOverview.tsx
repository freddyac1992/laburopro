import Link from 'next/link'
import DashboardShell from '@/components/dashboard/DashboardShell'

export type ProviderDashboardProfile = {
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

export type DashboardMetrics = {
  leadCount: number
  leadsToday: number
  leadsLastSevenDays: number
  leadsLastThirtyDays: number
  profileViews: number
  profileViewsToday: number
  profileViewsLastSevenDays: number
  profileViewsLastThirtyDays: number
  newLeadCount: number
  staleLeadCount: number
}

type ChecklistItem = {
  label: string
  done: boolean
  hint: string
}

function getProfileChecklist(provider: ProviderDashboardProfile): ChecklistItem[] {
  return [
    { label: 'WhatsApp configurado', done: Boolean(provider.whatsapp), hint: 'Es obligatorio para recibir contactos.' },
    { label: 'Categoría y ciudad', done: Boolean(provider.category?.name && provider.city?.name), hint: 'Ayuda a aparecer en búsquedas relevantes.' },
    { label: 'Descripción clara', done: Boolean(provider.description && provider.description.length >= 80), hint: 'Explica qué haces, cómo trabajas y qué zonas atiendes.' },
    { label: 'Servicios específicos', done: Boolean(provider.services && provider.services.length >= 3), hint: 'Lista al menos 3 servicios concretos.' },
    { label: 'Precio o referencia', done: Boolean(provider.price_reference), hint: 'Una referencia reduce dudas antes del contacto.' },
    { label: 'Disponibilidad', done: Boolean(provider.availability), hint: 'Indica horarios o días de atención.' },
    { label: 'Fotos del perfil', done: Boolean(provider.profile_photo_path && provider.work_photo_path), hint: 'Añade tu foto y una muestra de un trabajo realizado.' },
  ]
}

function getWaitingMessage(staleLeadCount: number) {
  if (staleLeadCount === 0) return 'Responder pronto aumenta las posibilidades de concretar el trabajo.'
  const verbSuffix = staleLeadCount === 1 ? '' : 'n'
  return `${staleLeadCount} lleva${verbSuffix} más de 24 horas esperando seguimiento.`
}

function getExperienceLabel(yearsExperience: number | null) {
  if (!yearsExperience) return 'Sin dato'
  const suffix = yearsExperience === 1 ? '' : 's'
  return `${yearsExperience} año${suffix}`
}

function getContactSummary(provider: ProviderDashboardProfile | null, leadCount: number) {
  if (!provider) return 'Crea tu perfil para empezar a recibir contactos.'
  const suffix = leadCount === 1 ? '' : 's'
  return `${leadCount} persona${suffix} hicieron click para contactarte por WhatsApp.`
}

function LeadAlert({ provider, metrics }: Readonly<{ provider: ProviderDashboardProfile | null; metrics: DashboardMetrics }>) {
  if (!provider || metrics.newLeadCount === 0) return null
  const alertClass = metrics.staleLeadCount > 0
    ? 'border-red-200 bg-red-50 text-red-900'
    : 'border-amber-200 bg-amber-50 text-amber-900'
  const title = metrics.newLeadCount === 1
    ? 'Una persona espera tu respuesta'
    : `${metrics.newLeadCount} personas esperan tu respuesta`

  return (
    <Link href="/dashboard/contactos?filter=new" className={`block rounded-lg border p-5 ${alertClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm mt-1 opacity-80">{getWaitingMessage(metrics.staleLeadCount)}</p>
        </div>
        <span className="text-sm font-semibold whitespace-nowrap">Ver quién escribió</span>
      </div>
    </Link>
  )
}

function ProfileStatus({ provider, leadCount }: Readonly<{ provider: ProviderDashboardProfile | null; leadCount: number }>) {
  if (!provider) {
    return (
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Lo más importante</h2>
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4 text-sm">Todavía no mostraste qué trabajo realizas.</p>
          <Link href="/dashboard/perfil" id="dashboard-create-profile-btn" className="inline-block px-6 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 transition-colors">
            Crear mi perfil de trabajo
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Lo más importante</h2>
      <div className="space-y-3">
        <StatusRow label="Tu información está guardada" value="Sí" valueClass="text-green-700" />
        <StatusRow label="Revisión de LaburoPro" value={provider.is_approved ? 'Listo' : 'Estamos revisando'} valueClass={provider.is_approved ? 'text-green-600' : 'text-amber-600'} />
        <StatusRow label="Identidad confirmada" value={provider.is_verified ? 'Sí' : 'Todavía no'} valueClass={provider.is_verified ? 'text-green-600' : 'text-gray-400'} />
        <StatusRow label="Personas interesadas" value={String(leadCount)} valueClass="text-teal-700" />
        {!provider.is_approved && <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">Estamos revisando tu perfil. Te mostraremos públicamente cuando esté listo.</div>}
        {provider.is_approved && (
          <div className="mt-3">
            <Link href={`/proveedores/${provider.slug}`} className="text-sm text-teal-700 hover:underline font-medium" target="_blank" id="dashboard-view-profile-link">
              Ver mi perfil como lo ven los clientes
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function StatusRow({ label, value, valueClass }: Readonly<{ label: string; value: string; valueClass: string }>) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-semibold text-sm ${valueClass}`}>{value}</span>
    </div>
  )
}

function MetricCard({ label, value, href }: Readonly<{ label: string; value: number; href?: string }>) {
  const content = <><div className="text-sm text-gray-500 mb-1">{label}</div><div className="text-3xl font-bold text-gray-900">{value}</div></>
  if (href) return <Link href={href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all">{content}</Link>
  return <div className="bg-white rounded-2xl border border-gray-100 p-5">{content}</div>
}

function ActivityStats({ metrics }: Readonly<{ metrics: DashboardMetrics }>) {
  const conversion = metrics.profileViewsLastThirtyDays > 0
    ? Math.round((metrics.leadsLastThirtyDays / metrics.profileViewsLastThirtyDays) * 100)
    : 0

  return (
    <>
      <section>
        <div className="flex items-end justify-between gap-4 mb-3">
          <div><h2 className="font-semibold text-gray-900">Personas que vieron tu perfil</h2><p className="text-sm text-gray-500">Cada visita es una persona que quiso conocer tu trabajo.</p></div>
          <div className="text-right"><div className="text-2xl font-bold text-teal-700">{conversion}%</div><div className="text-xs text-gray-500">de cada 100 visitas escribieron</div></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Visitas totales" value={metrics.profileViews} />
          <MetricCard label="Hoy" value={metrics.profileViewsToday} />
          <MetricCard label="Últimos 7 días" value={metrics.profileViewsLastSevenDays} />
          <MetricCard label="Últimos 30 días" value={metrics.profileViewsLastThirtyDays} />
        </div>
      </section>
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Personas que tocaron tu WhatsApp</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="En total" value={metrics.leadCount} href="/dashboard/contactos" />
          <MetricCard label="Hoy" value={metrics.leadsToday} />
          <MetricCard label="Últimos 7 días" value={metrics.leadsLastSevenDays} />
          <MetricCard label="Últimos 30 días" value={metrics.leadsLastThirtyDays} />
        </div>
      </section>
    </>
  )
}

function CompletionCard({ checklist }: Readonly<{ checklist: ChecklistItem[] }>) {
  const completed = checklist.filter((item) => item.done).length
  const percent = Math.round((completed / checklist.length) * 100)
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div><h2 className="font-semibold text-gray-900">Completa tu información</h2><p className="text-sm text-gray-500">Más información ayuda a que confíen en tu trabajo.</p></div>
        <div className="text-right"><div className="text-2xl font-bold text-gray-900">{percent}%</div><div className="text-xs text-gray-500">{completed}/{checklist.length}</div></div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5"><div className="h-full bg-teal-700 rounded-full" style={{ width: `${percent}%` }} /></div>
      <div className="space-y-3">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <span className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${item.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.done ? '✓' : '!'}</span>
            <div><p className="text-sm font-medium text-gray-900">{item.label}</p>{!item.done && <p className="text-xs text-gray-500">{item.hint}</p>}</div>
          </div>
        ))}
      </div>
      <Link href="/dashboard/perfil" className="mt-5 inline-flex px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors">Completar mi información</Link>
    </section>
  )
}

function PublicSummary({ provider }: Readonly<{ provider: ProviderDashboardProfile }>) {
  const isPublic = provider.is_approved && provider.is_active
  const rating = provider.rating > 0 ? `${provider.rating.toFixed(1)} (${provider.review_count})` : 'Sin reseñas'
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Resumen público</h2>
      <div className="space-y-3 text-sm">
        <StatusRow label="Servicio" value={provider.category?.name ?? 'Sin categoría'} valueClass="text-gray-900 text-right" />
        <StatusRow label="Ciudad" value={provider.city?.name ?? 'Sin ciudad'} valueClass="text-gray-900 text-right" />
        <StatusRow label="Calificación" value={rating} valueClass="text-gray-900 text-right" />
        <StatusRow label="Experiencia" value={getExperienceLabel(provider.years_experience)} valueClass="text-gray-900 text-right" />
        <StatusRow label="Estado comercial" value={isPublic ? 'Visible al público' : 'No visible aún'} valueClass={`text-right ${isPublic ? 'text-green-700' : 'text-amber-700'}`} />
      </div>
      {provider.is_approved
        ? <Link href={`/proveedores/${provider.slug}`} target="_blank" className="mt-5 inline-flex px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-teal-300 hover:text-teal-700 transition-colors">Ver como cliente</Link>
        : <p className="mt-5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">Tu perfil empezará a recibir contactos cuando sea aprobado por el equipo.</p>}
    </section>
  )
}

function ProviderInsights({ provider, metrics }: Readonly<{ provider: ProviderDashboardProfile | null; metrics: DashboardMetrics }>) {
  if (!provider) return null
  return (
    <>
      <ActivityStats metrics={metrics} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompletionCard checklist={getProfileChecklist(provider)} />
        <PublicSummary provider={provider} />
      </div>
    </>
  )
}

function QuickActions({ provider, leadCount }: Readonly<{ provider: ProviderDashboardProfile | null; leadCount: number }>) {
  const profileTitle = provider ? 'Editar perfil' : 'Crear perfil'
  const contactSummary = getContactSummary(provider, leadCount)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link href="/dashboard/perfil" id="dashboard-edit-profile-card" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all">
        <div className="text-3xl mb-3">👤</div><h3 className="font-semibold text-gray-900 mb-1">{profileTitle}</h3><p className="text-gray-500 text-sm">Completa o actualiza tu información de proveedor.</p>
      </Link>
      <div className="bg-white rounded-2xl border border-gray-100 p-5"><div className="text-3xl mb-3">⭐</div><h3 className="font-semibold text-gray-900 mb-1">Reseñas</h3><p className="text-gray-500 text-sm">Los clientes ya pueden dejar reseñas públicas moderadas en tu perfil.</p></div>
      <Link href="/dashboard/contactos" id="dashboard-contacts-card" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all">
        <div className="text-3xl mb-3">📲</div><h3 className="font-semibold text-gray-900 mb-1">Personas interesadas</h3><p className="text-gray-500 text-sm">{contactSummary}</p>
      </Link>
    </div>
  )
}

export default function DashboardOverview({ name, provider, metrics }: Readonly<{ name: string; provider: ProviderDashboardProfile | null; metrics: DashboardMetrics }>) {
  return (
    <DashboardShell title={`Hola, ${name}`} newLeadCount={metrics.newLeadCount}>
      <div className="space-y-6">
        <LeadAlert provider={provider} metrics={metrics} />
        <ProfileStatus provider={provider} leadCount={metrics.leadCount} />
        <ProviderInsights provider={provider} metrics={metrics} />
        <QuickActions provider={provider} leadCount={metrics.leadCount} />
      </div>
    </DashboardShell>
  )
}
