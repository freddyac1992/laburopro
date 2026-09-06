import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProviderCard from '@/components/ui/ProviderCard'
import CitySelector from '@/components/ui/CitySelector'
import EmptyState from '@/components/ui/EmptyState'
import ProviderFilters from '@/components/ui/ProviderFilters'
import { CategoryIcon } from '@/components/ui/CategoryCard'
import { CATEGORIES, CITIES, SITE_NAME, SITE_URL } from '@/lib/constants'
import { hasActiveProviderFilters, parseProviderFilters, searchProviders } from '@/lib/provider-search'

interface PageProps {
  readonly params: Promise<{ categoria: string; ciudad: string }>
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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
  const description = `Encuentra ${cat.name.toLowerCase()} con perfiles revisados por LaburoPro en ${city.name}, Bolivia. Contacta directamente por WhatsApp.`

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

export default async function CategoriayCiudadPage({ params, searchParams }: PageProps) {
  const { categoria, ciudad } = await params
  const filters = parseProviderFilters(await searchParams)
  const cat = CATEGORIES.find((c) => c.slug === categoria)
  const city = CITIES.find((c) => c.slug === ciudad)
  if (!cat || !city) notFound()

  const providers = await searchProviders({ categorySlug: categoria, citySlug: ciudad, filters })
  const hasFilters = hasActiveProviderFilters(filters)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-teal-700">Inicio</Link>
        <span>›</span>
        <Link href="/servicios" className="hover:text-teal-700">Servicios</Link>
        <span>›</span>
        <Link href={`/servicios/${categoria}`} className="hover:text-teal-700">{cat.name}</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{city.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
            <CategoryIcon slug={categoria} size={25} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight text-gray-900 md:text-3xl">
              {cat.name} en {city.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
            {cat.description} Encuentra trabajadores con perfiles revisados por LaburoPro en {city.name}.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 w-full md:w-56">
          <CitySelector currentCategory={categoria} currentCity={ciudad} />
        </div>
      </div>

      <ProviderFilters
        filters={filters}
        clearHref={`/servicios/${categoria}/${ciudad}`}
        resultCount={providers.length}
        locationLabel={city.name}
      />

      {/* Providers grid */}
      {providers.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No encontramos proveedores con esos filtros' : `No hay ${cat.name.toLowerCase()} en ${city.name} aún`}
          description={hasFilters ? 'Prueba quitando filtros o buscando en toda Bolivia.' : `Estamos creciendo en ${city.name}. ¿Eres ${cat.name.toLowerCase()}? Publica tu perfil gratis.`}
          icon={<CategoryIcon slug={categoria} size={30} />}
          action={
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {hasFilters ? (
                <Link
                  href={`/servicios/${categoria}/${ciudad}`}
                  className="min-h-12 rounded-md bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
                >
                  Limpiar filtros
                </Link>
              ) : (
                <Link
                  href="/registro"
                  className="min-h-12 rounded-md bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
                >
                  Publicar mi servicio
                </Link>
              )}
              <Link
                href={`/servicios/${categoria}`}
                className="min-h-12 rounded-md border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 hover:border-teal-400"
              >
                Ver en toda Bolivia
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <h2 className="sr-only">Trabajadores disponibles en {city.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p) => {
              const catData = p.category
              const cityData = p.city
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
                  profilePhotoPath={p.profile_photo_path}
                  imageVersion={p.updated_at}
                />
              )
            })}
          </div>
        </>
      )}

      {/* Other cities */}
      <div className="mt-10 border-t border-slate-200 pt-7">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {cat.name} en otras ciudades
        </h2>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.slug !== ciudad).map((c) => (
            <Link
              key={c.slug}
              href={`/servicios/${categoria}/${c.slug}`}
              className="min-h-11 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-teal-400 hover:text-teal-700"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-8 max-w-4xl border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-600">
        Encuentra <strong>{cat.name.toLowerCase()}</strong> con perfiles revisados por LaburoPro en {city.name}.
        Compara experiencia, fotos, precios de referencia y reseñas antes de contactar directamente por WhatsApp.
      </p>
    </div>
  )
}
