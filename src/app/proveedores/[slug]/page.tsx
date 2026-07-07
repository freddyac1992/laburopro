import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import VerificationBadge from '@/components/ui/VerificationBadge'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import type { ProviderProfile } from '@/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
}

type ProviderMetadata = ProviderProfile & {
  category: { name: string } | null
  city: { name: string } | null
}

type PublicProviderProfile = ProviderProfile & {
  category: { name: string; slug: string; icon: string | null } | null
  city: { name: string; slug: string } | null
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

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/proveedores/${slug}`,
      },
    }
  } catch {
    return {}
  }
}

async function getProvider(slug: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('provider_profiles')
      .select('*, category:categories(name, slug, icon), city:cities(name, slug)')
      .eq('slug', slug)
      .eq('is_approved', true)
      .eq('is_active', true)
      .single()
    return data as unknown as PublicProviderProfile | null
  } catch {
    return null
  }
}

export default async function ProviderProfilePage({ params }: PageProps) {
  const { slug } = await params
  const provider = await getProvider(slug)
  if (!provider) notFound()

  const category = provider.category
  const city = provider.city
  const initials = getInitials(provider.display_name)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-blue-700">Inicio</Link>
        <span>›</span>
        {category && (
          <>
            <Link href={`/servicios/${category.slug}`} className="hover:text-blue-700">
              {category.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{provider.display_name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main profile */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-blue-700 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-start flex-wrap gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{provider.display_name}</h1>
                  {provider.is_verified && <VerificationBadge size="md" />}
                </div>
                {category && (
                  <p className="text-blue-600 font-semibold text-base">
                    {category.icon} {category.name}
                  </p>
                )}
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {provider.zone ? `${provider.zone}, ` : ''}{city?.name ?? 'Bolivia'}
                </div>

                {/* Rating */}
                {provider.rating > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(provider.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {provider.rating.toFixed(1)} ({provider.review_count} reseña{provider.review_count !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {provider.description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Sobre mí</h2>
              <p className="text-gray-700 leading-relaxed">{provider.description}</p>
            </div>
          )}

          {/* Services */}
          {provider.services && provider.services.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Servicios ofrecidos</h2>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((service: string) => (
                  <span
                    key={service}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Safety disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4 text-center">Contactar al proveedor</h2>

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
            <div className="mt-5 space-y-3 text-sm">
              {provider.price_reference && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Precio referencial</span>
                  <span className="font-semibold text-gray-900">{provider.price_reference}</span>
                </div>
              )}
              {provider.years_experience && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Experiencia</span>
                  <span className="font-medium text-gray-900">
                    {provider.years_experience} año{provider.years_experience !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {provider.availability && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Disponibilidad</span>
                  <span className="font-medium text-gray-900">{provider.availability}</span>
                </div>
              )}
              {city && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500">Ciudad</span>
                  <span className="font-medium text-gray-900">{city.name}</span>
                </div>
              )}
            </div>

            {/* Verification info */}
            {provider.is_verified && (
              <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 rounded-xl p-3 text-xs">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>Perfil verificado por LaburoPro</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
