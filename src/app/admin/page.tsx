import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '@/components/admin/AdminShell'
import { createClient } from '@/lib/supabase/server'

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
    { count: approvedProviders },
    { count: verifiedProviders },
  ] = await Promise.all([
    supabase.from('provider_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false).eq('is_active', true),
    supabase.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('provider_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
  ])

  const stats = [
    { label: 'Total proveedores', value: totalProviders ?? 0, icon: '👥', color: 'blue' },
    { label: 'Pendientes de aprobación', value: pendingProviders ?? 0, icon: '⏳', color: 'amber' },
    { label: 'Aprobados', value: approvedProviders ?? 0, icon: '✅', color: 'green' },
    { label: 'Verificados', value: verifiedProviders ?? 0, icon: '🛡️', color: 'purple' },
  ]

  return (
    <AdminShell title={`Panel de administración`}>
      <p className="text-gray-500 -mt-4 mb-8">Bienvenido, {profile?.full_name ?? 'Admin'}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
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
