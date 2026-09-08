import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BriefcaseBusiness, CalendarClock, CircleDollarSign, MapPin, ShieldCheck, ShieldAlert } from 'lucide-react'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import VerificationBadge from '@/components/ui/VerificationBadge'
import ReviewForm from '@/components/ui/ReviewForm'
import ProviderReportForm from '@/components/ui/ProviderReportForm'
import FavoriteButton from '@/components/ui/FavoriteButton'
import StarRating from '@/components/ui/StarRating'
import { CategoryIcon } from '@/components/ui/CategoryCard'
import ProfileViewTracker from '@/components/analytics/ProfileViewTracker'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import { getProviderImageUrl } from '@/lib/provider-images'
import type { ProviderProfile, Review } from '@/types/database'

interface PageProps {
  readonly params: Promise<{ slug: string }>
  readonly searchParams: Promise<{ preview?: string | string[] }>
}

type ProviderMetadata = ProviderProfile & {
  category: { name: string } | null
  city: { name: string } | null
}

type PublicProviderProfile = ProviderProfile & {
  category: { name: string; slug: string; icon: string | null } | null
  city: { name: string; slug: string } | null
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeZone: 'America/La_Paz',
  }).format(new Date(value))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('provider_profiles')
      .select('*, category:categories(name), city:cities(name)')
      .eq('slug', slug)
      .eq('is_approved', true)
      .eq('is_active', true)
      .single()
    const provider = data as unknown as ProviderMetadata | null

    if (!provider) return {}

    const catName = provider.category?.name
    const cityName = provider.city?.name
    const title = `${provider.display_name} — ${catName ?? 'Proveedor'} en ${cityName ?? 'Bolivia'} | ${SITE_NAME}`
    const description = provider.description ?? `Perfil de ${provider.display_name} en LaburoPro. ${catName} en ${cityName}.`
    const socialImage = getProviderImageUrl(provider.work_photo_path ?? provider.profile_photo_path, provider.updated_at)

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/proveedores/${slug}`,
        ...(socialImage ? { images: [{ url: socialImage }] } : {}),
      },
    }
  } catch {
    return {}
  }
}

async function canPreviewUnpublishedProfile(preview: string | string[] | undefined) {
  if (preview !== 'admin') return false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    return profile?.role === 'admin'
  } catch {
    return false
  }
}

async function getProvider(slug: string, includeUnpublished = false) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('provider_profiles')
      .select('*, category:categories(name, slug, icon), city:cities(name, slug)')
      .eq('slug', slug)

    if (!includeUnpublished) {
      query = query.eq('is_approved', true).eq('is_active', true)
    }

    const { data } = await query.single()
    return data as unknown as PublicProviderProfile | null
  } catch {
    return null
  }
}

async function getApprovedReviews(providerId: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, reviewer_name, is_approved, created_at, provider_id')
      .eq('provider_id', providerId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20)

    return (data ?? []) as Review[]
  } catch {
    return []
  }
}

function getReviewSummary(reviewCount: number) {
  if (reviewCount === 0) return 'Aún no hay reseñas aprobadas'
  const suffix = reviewCount === 1 ? '' : 's'
  return `${reviewCount} reseña${suffix} aprobada${suffix}`
}

export default async function ProviderProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { preview } = await searchParams
  const isAdminPreview = await canPreviewUnpublishedProfile(preview)
  const provider = await getProvider(slug, isAdminPreview)
  if (!provider) notFound()

  const reviews = await getApprovedReviews(provider.id)
  const category = provider.category
  const city = provider.city
  const initials = getInitials(provider.display_name)
  const profilePhotoUrl = getProviderImageUrl(provider.profile_photo_path, provider.updated_at)
  const workPhotoUrl = getProviderImageUrl(provider.work_photo_path, provider.updated_at)
  const favoriteProvider = {
    id: provider.id,
    slug: provider.slug,
    displayName: provider.display_name,
    categoryName: category?.name,
    cityName: city?.name,
    zone: provider.zone,
    description: provider.description,
    priceReference: provider.price_reference,
    rating: provider.rating,
    reviewCount: provider.review_count,
    isVerified: provider.is_verified,
    yearsExperience: provider.years_experience,
    profilePhotoPath: provider.profile_photo_path,
    workPhotoPath: provider.work_photo_path,
    imageVersion: provider.updated_at,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      {!isAdminPreview && <ProfileViewTracker providerId={provider.id} />}

      {isAdminPreview && (!provider.is_approved || !provider.is_active) && (
        <div className="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 rounded-lg">
          Vista previa de administrador: este perfil {provider.is_active ? 'todavía no está aprobado' : 'está inactivo'} y no es visible públicamente.
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-teal-700">Inicio</Link>
        <span>›</span>
        {category && (
          <>
            <Link href={`/servicios/${category.slug}`} className="hover:text-teal-700">
              {category.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{provider.display_name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {/* Main profile */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile header */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex items-start gap-4 p-5 sm:gap-5 sm:p-6">
              {/* Avatar */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal-700 text-2xl font-bold text-white">
                {profilePhotoUrl ? (
                  <Image
                    src={profilePhotoUrl}
                    alt={`Foto de perfil de ${provider.display_name}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-start flex-wrap gap-2 min-w-0">
                    <div>
                      <p className="mb-1 text-xs font-extrabold uppercase text-teal-700">Perfil de trabajo</p>
                      <h1 className="text-2xl font-extrabold leading-tight text-[#102a33] sm:text-3xl">{provider.display_name}</h1>
                    </div>
                  </div>
                  {!isAdminPreview && (
                    <FavoriteButton provider={favoriteProvider} className="w-10 h-10 rounded-full flex-shrink-0" />
                  )}
                </div>
                {category && (
                  <p className="mt-2 flex items-center gap-2 text-base font-bold text-teal-700">
                    <CategoryIcon slug={category.slug} size={19} /> {category.name}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {provider.zone ? `${provider.zone}, ` : ''}{city?.name ?? 'Bolivia'}
                </div>

                {/* Rating */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {provider.is_verified && <VerificationBadge size="sm" />}
                  {provider.rating > 0 ? (
                    <div className="flex items-center gap-2">
                    <StarRating value={provider.rating} size="sm" label="Calificación promedio" />
                    <span className="text-sm font-bold text-[#102a33]">
                      {provider.rating.toFixed(1)} · {provider.review_count} opinión{provider.review_count !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  ) : <span className="text-sm text-slate-500">Aún sin reseñas</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 bg-[#f6f8f7] text-sm sm:grid-cols-3">
              <div className="flex min-h-16 items-center gap-2 border-r border-slate-200 px-4 py-3 font-semibold text-slate-700">
                <ShieldCheck className="h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                Perfil revisado
              </div>
              {provider.years_experience ? (
                <div className="flex min-h-16 items-center gap-2 px-4 py-3 font-semibold text-slate-700 sm:border-r sm:border-slate-200">
                  <BriefcaseBusiness className="h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                  {provider.years_experience} año{provider.years_experience !== 1 ? 's' : ''} trabajando
                </div>
              ) : (
                <div className="flex min-h-16 items-center gap-2 px-4 py-3 font-semibold text-slate-700 sm:border-r sm:border-slate-200">
                  <MapPin className="h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                  {city?.name ?? 'Bolivia'}
                </div>
              )}
              <div className="col-span-2 flex min-h-16 items-center gap-2 border-t border-slate-200 px-4 py-3 font-semibold text-slate-700 sm:col-span-1 sm:border-t-0">
                <CircleDollarSign className="h-5 w-5 shrink-0 text-[#e85d3f]" aria-hidden="true" />
                {provider.price_reference ?? 'Consulta el precio'}
              </div>
            </div>
          </div>

          {!isAdminPreview && provider.whatsapp && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 md:hidden">
              <p className="mb-3 text-sm font-bold text-teal-950">¿Te interesa su trabajo? Escríbele directamente.</p>
              <WhatsAppButton phone={provider.whatsapp} providerName={provider.display_name} providerId={provider.id} size="md" className="w-full" />
            </div>
          )}

          {/* Description */}
          {provider.description && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-extrabold text-[#102a33]">Sobre su trabajo</h2>
              <p className="text-gray-700 leading-relaxed">{provider.description}</p>
            </div>
          )}

          {workPhotoUrl && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-extrabold text-[#102a33]">Una muestra de su trabajo</h2>
                <p className="mt-1 text-sm text-slate-500">Foto publicada por el proveedor.</p>
              </div>
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={workPhotoUrl}
                  alt={`Trabajo realizado por ${provider.display_name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Services */}
          {provider.services && provider.services.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-extrabold text-[#102a33]">Trabajos que realiza</h2>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((service: string) => (
                  <span
                    key={service}
                    className="rounded-md border border-teal-100 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-800"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Reseñas</h2>
                <p className="text-sm text-gray-500">
                  {getReviewSummary(reviews.length)}
                </p>
              </div>
              {provider.rating > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{provider.rating.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">promedio</div>
                </div>
              )}
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {review.reviewer_name ?? 'Cliente de LaburoPro'}
                        </div>
                        <div className="mt-1">
                          <StarRating value={review.rating} size="sm" label="Calificación de la reseña" />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatReviewDate(review.created_at)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sé la primera persona en compartir una experiencia con este proveedor.</p>
            )}
          </div>

          <ReviewForm providerId={provider.id} providerName={provider.display_name} />
          <ProviderReportForm providerId={provider.id} providerName={provider.display_name} />

          {/* Safety disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <ShieldAlert className="h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-amber-900 text-sm mb-1">Aviso de seguridad</h3>
                <p className="text-amber-800 text-xs leading-relaxed">
                  LaburoPro verifica la identidad de los proveedores, pero te recomendamos siempre pedir
                  referencias adicionales, acordar precios antes del trabajo y no realizar pagos
                  anticipados sin conocer al proveedor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact card */}
          <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-extrabold text-[#102a33]">Habla directamente</h2>
            <p className="mb-4 mt-1 text-sm leading-relaxed text-slate-600">Consulta disponibilidad y acuerda el trabajo por WhatsApp.</p>

            {provider.whatsapp ? (
              <WhatsAppButton
                phone={provider.whatsapp}
                providerName={provider.display_name}
                providerId={provider.id}
                size="md"
                pulse
                className="w-full"
              />
            ) : (
              <p className="text-gray-400 text-sm text-center">
                Este proveedor aún no tiene WhatsApp configurado.
              </p>
            )}

            {/* Quick info */}
            <div className="mt-5 space-y-1 text-sm">
              {provider.price_reference && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="flex items-center gap-2 text-gray-500"><CircleDollarSign className="h-4 w-4" aria-hidden="true" />Precio referencial</span>
                  <span className="font-semibold text-gray-900">{provider.price_reference}</span>
                </div>
              )}
              {provider.years_experience && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="flex items-center gap-2 text-gray-500"><BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />Experiencia</span>
                  <span className="font-medium text-gray-900">
                    {provider.years_experience} año{provider.years_experience !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {provider.availability && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="flex items-center gap-2 text-gray-500"><CalendarClock className="h-4 w-4" aria-hidden="true" />Disponibilidad</span>
                  <span className="font-medium text-gray-900">{provider.availability}</span>
                </div>
              )}
              {city && (
                <div className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-gray-500"><MapPin className="h-4 w-4" aria-hidden="true" />Ciudad</span>
                  <span className="font-medium text-gray-900">{city.name}</span>
                </div>
              )}
            </div>

            {/* Verification info */}
            {provider.is_verified && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-xs text-green-700">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Identidad confirmada por LaburoPro</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
