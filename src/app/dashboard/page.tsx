import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { createClient } from '@/lib/supabase/server'

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
    .select('id, display_name, slug, is_approved, is_verified, is_active')
    .eq('user_id', user.id)
    .maybeSingle())

  const { count: leadCount } = providerProfile
    ? await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerProfile.id)
    : { count: 0 }

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

          <div className="bg-white rounded-2xl border border-gray-100 p-5 opacity-60">
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="font-semibold text-gray-900 mb-1">Reseñas</h3>
            <p className="text-gray-500 text-sm">Próximamente: ve y responde las reseñas de clientes.</p>
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
