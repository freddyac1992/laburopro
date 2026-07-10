import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProviderCard from '@/components/ui/ProviderCard'
import CitySelector from '@/components/ui/CitySelector'
import EmptyState from '@/components/ui/EmptyState'
import ProviderFilters from '@/components/ui/ProviderFilters'
import { CATEGORIES, CITIES, SITE_NAME, SITE_URL } from '@/lib/constants'
import { hasActiveProviderFilters, parseProviderFilters, searchProviders } from '@/lib/provider-search'

interface PageProps {
  params: Promise<{ categoria: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ categoria: cat.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria } = await params
  const cat = CATEGORIES.find((c) => c.slug === categoria)
  if (!cat) return {}

  const title = `${cat.name} en Bolivia — ${SITE_NAME}`
  const description = `${cat.description} Encuentra ${cat.name.toLowerCase()} verificados en Santa Cruz, La Paz, Cochabamba y todo Bolivia en LaburoPro.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/servicios/${categoria}`,
    },
  }
}

export default async function CategoriaPage({ params, searchParams }: PageProps) {
  const { categoria } = await params
  const filters = parseProviderFilters(await searchParams)
  const cat = CATEGORIES.find((c) => c.slug === categoria)
  if (!cat) notFound()

  const providers = await searchProviders({ categorySlug: categoria, filters })
  const hasFilters = hasActiveProviderFilters(filters)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-700">Inicio</Link>
        <span>›</span>
        <Link href="/servicios" className="hover:text-blue-700">Servicios</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{cat.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{cat.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">{cat.name}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">{cat.description}</p>
        </div>
        <div className="flex-shrink-0 w-full md:w-56">
          <CitySelector currentCategory={categoria} />
        </div>
      </div>

      {/* SEO text */}
      <div className="bg-blue-50 rounded-2xl p-5 mb-8 text-sm text-gray-700 leading-relaxed">
        <p>
          Encuentra <strong>{cat.name.toLowerCase()} verificados</strong> en Bolivia a través de LaburoPro.
          Compara perfiles, revisa experiencia, precios de referencia y contacta directamente por WhatsApp.
          Disponible en Santa Cruz, La Paz, Cochabamba, El Alto y más ciudades del país.
        </p>
      </div>

      <ProviderFilters
        filters={filters}
        clearHref={`/servicios/${categoria}`}
        resultCount={providers.length}
      />

      {/* Providers grid */}
      {providers.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No encontramos proveedores con esos filtros' : `No hay proveedores disponibles en ${cat.name} aún`}
          description={hasFilters ? 'Prueba quitando filtros o usando una búsqueda más general.' : 'Estamos creciendo. Sé el primero en publicar tu servicio en esta categoría.'}
          icon={cat.icon}
          action={
            hasFilters ? (
              <Link
                href={`/servicios/${categoria}`}
                className="inline-block px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800"
              >
                Limpiar filtros
              </Link>
            ) : (
              <Link
                href="/registro"
                className="inline-block px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800"
              >
                Publicar mi servicio
              </Link>
            )
          }
        />
      ) : (
        <>
          <p className="text-gray-500 text-sm mb-5">
            {providers.length} proveedor{providers.length !== 1 ? 'es' : ''} encontrado{providers.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p) => {
              const cat = p.category
              const city = p.city
              return (
                <ProviderCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  displayName={p.display_name}
                  categoryName={cat?.name}
                  cityName={city?.name}
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

      {/* City links for SEO */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {cat.name} por ciudad
        </h2>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/servicios/${categoria}/${city.slug}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              {cat.name} en {city.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
