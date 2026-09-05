import { redirect } from 'next/navigation'
import DashboardOverview, {
  type DashboardMetrics,
  type ProviderDashboardProfile,
} from '@/components/dashboard/DashboardOverview'
import { createClient } from '@/lib/supabase/server'

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function startOfTodayInLaPaz() {
  const localDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' })
  return new Date(`${localDate}T00:00:00-04:00`).toISOString()
}

const EMPTY_METRICS: DashboardMetrics = {
  leadCount: 0,
  leadsToday: 0,
  leadsLastSevenDays: 0,
  leadsLastThirtyDays: 0,
  profileViews: 0,
  profileViewsToday: 0,
  profileViewsLastSevenDays: 0,
  profileViewsLastThirtyDays: 0,
  newLeadCount: 0,
  staleLeadCount: 0,
}

async function loadMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  providerId: string | undefined,
): Promise<DashboardMetrics> {
  if (!providerId) return EMPTY_METRICS

  const analytics = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerId),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).gte('created_at', startOfTodayInLaPaz()),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).gte('created_at', since(7)),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).gte('created_at', since(30)),
    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerId),
    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).gte('created_at', startOfTodayInLaPaz()),
    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).gte('created_at', since(7)),
    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).gte('created_at', since(30)),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).eq('status', 'new'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('provider_id', providerId).eq('status', 'new').lt('created_at', since(1)),
  ])
  const count = (index: number) => analytics[index]?.count ?? 0

  return {
    leadCount: count(0),
    leadsToday: count(1),
    leadsLastSevenDays: count(2),
    leadsLastThirtyDays: count(3),
    profileViews: count(4),
    profileViewsToday: count(5),
    profileViewsLastSevenDays: count(6),
    profileViewsLastThirtyDays: count(7),
    newLeadCount: count(8),
    staleLeadCount: count(9),
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'admin') redirect('/admin')

  const { data: providerProfile } = (await supabase
    .from('provider_profiles')
    .select('id, display_name, slug, zone, description, services, years_experience, price_reference, whatsapp, availability, profile_photo_path, work_photo_path, is_approved, is_verified, is_active, rating, review_count, category:categories(name), city:cities(name)')
    .eq('user_id', user.id)
    .maybeSingle()) as { data: ProviderDashboardProfile | null }

  const metrics = await loadMetrics(supabase, providerProfile?.id)

  return (
    <DashboardOverview
      name={profile?.full_name ?? 'trabajador'}
      provider={providerProfile}
      metrics={metrics}
    />
  )
}
