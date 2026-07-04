import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProviderCard from '@/components/ui/ProviderCard'
import CitySelector from '@/components/ui/CitySelector'
import EmptyState from '@/components/ui/EmptyState'
import { CATEGORIES, CITIES, SITE_NAME, SITE_URL } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ categoria: string; ciudad: string }>
}

export async function generateStaticParams() {
  const params: { categoria: string; ciudad: string }[] = []
  for (const cat of CATEGORIES) {
    for (const city of CITIES) {
      params.push({ categoria: cat.slug, ciudad: city.slug })
    }
  }
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria, ciudad } = await params
  const cat = CATEGORIES.find((c) => c.slug === categoria)
  const city = CITIES.find((c) => c.slug === ciudad)
  if (!cat || !city) return {}

  const title = `${cat.name} en ${city.name} — ${SITE_NAME}`
  const description = `Encuentra ${cat.name.toLowerCase()} verificados en ${city.name}, Bolivia. Contacta directamente por WhatsApp en LaburoPro.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/servicios/${categoria}/${ciudad}`,
    },
  }
}

async function getProviders(categorySlug: string, citySlug: string) {
  try {
    const supabase = await createClient()
    const { data } = (await supabase
      .from('provider_profiles')
      .select('*, category:categories(name, slug), city:cities(name, slug)')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('rating', { ascending: false })) as any

    return (data ?? []).filter(
      (p: any) =>
        p.category &&
        (p.category as { slug: string }).slug === categorySlug &&
        p.city &&
        (p.city as { slug: string }).slug === citySlug
    )
  } catch {
    return []
  }
}

export default async function CategoriayCiudadPage({ params }: PageProps) {
  const { categoria, ciudad } = await params
  const cat = CATEGORIES.find((c) => c.slug === categoria)
  const city = CITIES.find((c) => c.slug === ciudad)
  if (!cat || !city) notFound()

  const providers = await getProviders(categoria, ciudad)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-blue-700">Inicio</Link>
        <span>›</span>
        <Link href="/servicios" className="hover:text-blue-700">Servicios</Link>
        <span>›</span>
        <Link href={`/servicios/${categoria}`} className="hover:text-blue-700">{cat.name}</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{city.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{cat.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">
              {cat.name} en {city.name}
            </h1>
          </div>
          <p className="text-gray-600">
            {cat.description} Encuentra proveedores verificados en {city.name}.
          </p>
        </div>
        <div className="flex-shrink-0 w-full md:w-56">
          <CitySelector currentCategory={categoria} currentCity={ciudad} />
        </div>
      </div>

      {/* Providers grid */}
      {providers.length === 0 ? (
        <EmptyState
          title={`No hay ${cat.name.toLowerCase()} en ${city.name} aún`}
          description={`Estamos creciendo en ${city.name}. ¿Eres ${cat.name.toLowerCase()}? Publica tu perfil gratis.`}
          icon={cat.icon}
          action={
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/registro"
                className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800"
              >
                Publicar mi servicio
              </Link>
              <Link
                href={`/servicios/${categoria}`}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-blue-400"
              >
                Ver en toda Bolivia
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <p className="text-gray-500 text-sm mb-5">
            {providers.length} proveedor{providers.length !== 1 ? 'es' : ''} en {city.name}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p: any) => {
              const catData = p.category as { name: string } | undefined
              const cityData = p.city as { name: string } | undefined
              return (
                <ProviderCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  displayName={p.display_name}
                  categoryName={catData?.name}
                  cityName={cityData?.name}
                  zone={p.zone}
                  description={p.description}
                  priceReference={p.price_reference}
                  rating={p.rating}
                  reviewCount={p.review_count}
                  isVerified={p.is_verified}
                  yearsExperience={p.years_experience}
                />
              )
            })}
          </div>
        </>
      )}

      {/* Other cities */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {cat.name} en otras ciudades
        </h2>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.slug !== ciudad).map((c) => (
            <Link
              key={c.slug}
              href={`/servicios/${categoria}/${c.slug}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
