import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '@/components/admin/AdminShell'
import { createClient } from '@/lib/supabase/server'

type RecentLead = {
  id: string
  created_at: string
  source: string | null
  provider: {
    display_name: string | null
    slug: string | null
    city: { name: string | null } | null
  } | null
}

type RecentReview = {
  id: string
  rating: number
  comment: string | null
  reviewer_name: string | null
  created_at: string
  provider: {
    display_name: string | null
    slug: string | null
  } | null
}

type RecentReport = {
  id: string
  reason: string
  details: string | null
  created_at: string
  provider: {
    display_name: string | null
    slug: string | null
  } | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(value))
}

function since(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle())

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Stats
  const [
    { count: totalProviders },
    { count: pendingProviders },
    { count: verifiedProviders },
    { count: leadsLastSevenDays },
    { count: profileViewsLastSevenDays },
    { count: pendingReviews },
    { count: pendingReports },
    { data: recentLeads },
    { data: recentReviews },
    { data: recentReports },
  ] = await Promise.all([
    supabase.from('provider_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false).eq('is_active', true),
    supabase.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', since(7)),
    supabase.from('profile_views').select('*', { count: 'exact', head: true }).gte('created_at', since(7)),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('provider_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('leads')
      .select('id, created_at, source, provider:provider_profiles(display_name, slug, city:cities(name))')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('id, rating, comment, reviewer_name, created_at, provider:provider_profiles(display_name, slug)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('provider_reports')
      .select('id, reason, details, created_at, provider:provider_profiles(display_name, slug)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Total proveedores', value: totalProviders ?? 0, icon: '👥', color: 'blue' },
    { label: 'Pendientes de aprobación', value: pendingProviders ?? 0, icon: '⏳', color: 'amber' },
    { label: 'Vistas últimos 7 días', value: profileViewsLastSevenDays ?? 0, icon: '👁️', color: 'blue' },
    { label: 'Leads últimos 7 días', value: leadsLastSevenDays ?? 0, icon: '📲', color: 'green' },
    { label: 'Verificados', value: verifiedProviders ?? 0, icon: '🛡️', color: 'purple' },
  ]

  const actionQueue = [
    {
      label: 'Proveedores por aprobar',
      value: pendingProviders ?? 0,
      href: '/admin/proveedores',
      action: 'Revisar proveedores',
    },
    {
      label: 'Reseñas por moderar',
      value: pendingReviews ?? 0,
      href: '/admin/resenas',
      action: 'Moderar reseñas',
    },
    {
      label: 'Reportes pendientes',
      value: pendingReports ?? 0,
      href: '/admin/reportes',
      action: 'Revisar reportes',
    },
  ]
  const leadRows = (recentLeads ?? []) as unknown as RecentLead[]
  const reviewRows = (recentReviews ?? []) as unknown as RecentReview[]
  const reportRows = (recentReports ?? []) as unknown as RecentReport[]

  return (
    <AdminShell title={`Panel de administración`}>
      <p className="text-gray-500 -mt-4 mb-8">Bienvenido, {profile?.full_name ?? 'Admin'}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {actionQueue.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <p className="text-3xl font-bold text-gray-900">{item.value}</p>
              </div>
              {item.value > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                  Acción
                </span>
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-blue-700">{item.action}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Leads recientes</h2>
            <p className="text-sm text-gray-500">Últimos clicks a WhatsApp</p>
          </div>
          <div className="divide-y divide-gray-100">
            {leadRows.length > 0 ? leadRows.map((lead) => (
              <div key={lead.id} className="p-4">
                <p className="font-medium text-gray-900 text-sm">{lead.provider?.display_name ?? 'Proveedor eliminado'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {[lead.provider?.city?.name, lead.source ?? 'whatsapp'].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(lead.created_at)}</p>
              </div>
            )) : (
              <p className="p-5 text-sm text-gray-500">Aún no hay leads registrados.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Reseñas pendientes</h2>
            <p className="text-sm text-gray-500">Experiencias por aprobar</p>
          </div>
          <div className="divide-y divide-gray-100">
            {reviewRows.length > 0 ? reviewRows.map((review) => (
              <div key={review.id} className="p-4">
                <p className="font-medium text-gray-900 text-sm">{review.provider?.display_name ?? 'Proveedor eliminado'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {review.rating} estrella{review.rating !== 1 ? 's' : ''} · {review.reviewer_name ?? 'Cliente'}
                </p>
                {review.comment && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{review.comment}</p>
                )}
              </div>
            )) : (
              <p className="p-5 text-sm text-gray-500">No hay reseñas pendientes.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Reportes pendientes</h2>
            <p className="text-sm text-gray-500">Casos por revisar</p>
          </div>
          <div className="divide-y divide-gray-100">
            {reportRows.length > 0 ? reportRows.map((report) => (
              <div key={report.id} className="p-4">
                <p className="font-medium text-gray-900 text-sm">{report.provider?.display_name ?? 'Proveedor eliminado'}</p>
                <p className="text-xs text-gray-500 mt-1">{report.reason}</p>
                {report.details && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{report.details}</p>
                )}
              </div>
            )) : (
              <p className="p-5 text-sm text-gray-500">No hay reportes pendientes.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/proveedores"
          id="admin-providers-link"
          className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-semibold text-gray-900 mb-1">Gestionar proveedores</h3>
          <p className="text-gray-500 text-sm">Aprobar, verificar o desactivar perfiles de proveedores.</p>
          {(pendingProviders ?? 0) > 0 && (
            <span className="mt-3 inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              {pendingProviders} pendiente{pendingProviders !== 1 ? 's' : ''}
            </span>
          )}
        </Link>

        <Link
          href="/admin/contactos"
          id="admin-leads-link"
          className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">📲</div>
          <h3 className="font-semibold text-gray-900 mb-1">Ver contactos</h3>
          <p className="text-gray-500 text-sm">Medir qué proveedores reciben intención real de clientes por WhatsApp.</p>
        </Link>

        <Link
          href="/admin/resenas"
          id="admin-reviews-link"
          className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">⭐</div>
          <h3 className="font-semibold text-gray-900 mb-1">Moderar reseñas</h3>
          <p className="text-gray-500 text-sm">Aprobar experiencias reales y mantener la reputación confiable.</p>
        </Link>

        <Link
          href="/admin/reportes"
          id="admin-reports-link"
          className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="font-semibold text-gray-900 mb-1">Revisar reportes</h3>
          <p className="text-gray-500 text-sm">Detectar perfiles con datos dudosos, mal servicio o reclamos de usuarios.</p>
        </Link>
      </div>
    </AdminShell>
  )
}
