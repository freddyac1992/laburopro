import type { Metadata } from 'next'
import Link from 'next/link'
import CategoryCard from '@/components/ui/CategoryCard'
import ProviderCard from '@/components/ui/ProviderCard'
import ProviderFilters from '@/components/ui/ProviderFilters'
import { CATEGORIES, CITIES, SITE_NAME } from '@/lib/constants'
import { hasActiveProviderFilters, parseProviderFilters, searchProviders } from '@/lib/provider-search'

export const metadata: Metadata = {
  title: `Todos los servicios — ${SITE_NAME}`,
  description:
    'Explora todas las categorías de servicios disponibles en LaburoPro. Plomeros, albañiles, electricistas, niñeras, tutores, fletes y muchos más en Bolivia.',
}

interface ServiciosPageProps {
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ServiciosPage({ searchParams }: ServiciosPageProps) {
  const params = await searchParams
  const filters = parseProviderFilters(params)
  const citySlug = firstParam(params.city)
  const city = CITIES.find((item) => item.slug === citySlug)
  const hasFilters = hasActiveProviderFilters(filters) || Boolean(city)
  const providers = hasFilters
    ? await searchProviders({ filters, citySlug: city?.slug, limit: 60 })
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Todos los servicios
        </h1>
        <p className="text-slate-600 max-w-2xl text-base">
          Encuentra el trabajador que necesitas. Perfiles revisados por LaburoPro en toda Bolivia.
        </p>
      </div>

      <ProviderFilters
        filters={filters}
        clearHref="/servicios"
        resultCount={hasFilters ? providers.length : undefined}
        locationLabel={city?.name}
        citySlug={city?.slug}
        showCityFilter
      />

      {hasFilters && (
        <div className="mb-12">
          {providers.length > 0 ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Proveedores encontrados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    id={provider.id}
                    slug={provider.slug}
                    displayName={provider.display_name}
                    categoryName={provider.category?.name}
                    cityName={provider.city?.name}
                    zone={provider.zone}
                    description={provider.description}
                    priceReference={provider.price_reference}
                    rating={provider.rating}
                    reviewCount={provider.review_count}
                    isVerified={provider.is_verified}
                    yearsExperience={provider.years_experience}
                    profilePhotoPath={provider.profile_photo_path}
                    imageVersion={provider.updated_at}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="border-y border-slate-200 py-8 mb-8">
              <h2 className="font-semibold text-gray-900 mb-2">No encontramos proveedores con esos filtros</h2>
              <p className="text-sm text-gray-500">Prueba con otra ciudad, menos filtros o una búsqueda más general.</p>
              <Link href="/servicios" className="mt-4 min-h-12 inline-flex items-center rounded-md bg-teal-700 px-5 font-bold text-white hover:bg-teal-800">Ver todos los oficios</Link>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">{hasFilters ? 'Buscar por oficio' : 'Elige un oficio'}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.slug}
            name={cat.name}
            slug={cat.slug}
            icon={cat.icon}
            description={cat.description}
          />
        ))}
      </div>

      {/* Cities hint */}
      <div className="mt-10 border-t border-slate-200 pt-6">
        <p className="text-gray-700 font-medium mb-2">¿Buscas en una ciudad específica?</p>
        <p className="text-gray-500 text-sm">
          Selecciona una categoría y luego filtra por tu ciudad: Santa Cruz, La Paz, Cochabamba y más.
        </p>
      </div>
    </div>
  )
}
