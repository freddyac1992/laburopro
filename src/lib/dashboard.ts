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

export function getPublicationState(provider: Pick<ProviderDashboardProfile, 'is_approved' | 'is_active'>) {
  if (!provider.is_active) return { label: 'Perfil pausado', description: 'Tu perfil no aparece en las búsquedas. Revisa su estado con el equipo de LaburoPro.', isPublic: false }
  if (!provider.is_approved) return { label: 'En revisión', description: 'Tu información está guardada. El equipo debe aprobarla antes de que aparezca en las búsquedas.', isPublic: false }
  return { label: 'Visible al público', description: 'Los clientes pueden encontrar tu trabajo y abrir tu WhatsApp.', isPublic: true }
}

export function getProfileChecklist(provider: ProviderDashboardProfile) {
  return [
    { label: 'Número de WhatsApp', done: Boolean(provider.whatsapp) },
    { label: 'Categoría y ciudad', done: Boolean(provider.category?.name && provider.city?.name) },
    { label: 'Descripción de al menos 80 caracteres', done: Boolean(provider.description && provider.description.trim().length >= 80) },
    { label: 'Al menos 3 servicios', done: (provider.services?.filter((service) => service.trim()).length ?? 0) >= 3 },
    { label: 'Referencia de precio', done: Boolean(provider.price_reference?.trim()) },
    { label: 'Días u horarios de atención', done: Boolean(provider.availability?.trim()) },
    { label: 'Tu foto y una foto de trabajo', done: Boolean(provider.profile_photo_path && provider.work_photo_path) },
  ]
}

export type ActivityPeriod = 'today' | 'week' | 'month' | 'all'

export function getActivity(metrics: DashboardMetrics, period: ActivityPeriod) {
  const periods = {
    today: { views: metrics.profileViewsToday, contacts: metrics.leadsToday },
    week: { views: metrics.profileViewsLastSevenDays, contacts: metrics.leadsLastSevenDays },
    month: { views: metrics.profileViewsLastThirtyDays, contacts: metrics.leadsLastThirtyDays },
    all: { views: metrics.profileViews, contacts: metrics.leadCount },
  }
  return periods[period]
}
