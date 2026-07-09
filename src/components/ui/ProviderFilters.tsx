import Link from 'next/link'
import { CITIES } from '@/lib/constants'
import type { ProviderFilters as ProviderFiltersState } from '@/lib/provider-search'

interface ProviderFiltersProps {
  filters: ProviderFiltersState
  clearHref: string
  resultCount: number
  locationLabel?: string
  citySlug?: string
  showCityFilter?: boolean
}

export default function ProviderFilters({
  filters,
  clearHref,
  resultCount,
  locationLabel,
  citySlug,
  showCityFilter = false,
}: ProviderFiltersProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
      <form method="get" className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
        <div>
          <label htmlFor="provider-search-q" className="block text-sm font-medium text-gray-700 mb-1.5">
            Buscar por nombre, zona o detalle
          </label>
          <input
            id="provider-search-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Ej. urgencias, zona sur, instalación"
            className="form-input bg-white text-gray-900"
          />
        </div>

        {showCityFilter && (
          <div>
            <label htmlFor="provider-search-city" className="block text-sm font-medium text-gray-700 mb-1.5">
              Ciudad
            </label>
            <select
              id="provider-search-city"
              name="city"
              defaultValue={citySlug ?? ''}
              className="form-input bg-white text-gray-900 cursor-pointer"
            >
              <option value="">Toda Bolivia</option>
              {CITIES.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="provider-search-experience" className="block text-sm font-medium text-gray-700 mb-1.5">
            Experiencia
          </label>
          <select
            id="provider-search-experience"
            name="experience"
            defaultValue={filters.minExperience?.toString() ?? ''}
            className="form-input bg-white text-gray-900 cursor-pointer"
          >
            <option value="">Cualquiera</option>
            <option value="1">1+ años</option>
            <option value="3">3+ años</option>
            <option value="5">5+ años</option>
            <option value="10">10+ años</option>
          </select>
        </div>

        <div>
          <label htmlFor="provider-search-sort" className="block text-sm font-medium text-gray-700 mb-1.5">
            Ordenar
          </label>
          <select
            id="provider-search-sort"
            name="sort"
            defaultValue={filters.sort}
            className="form-input bg-white text-gray-900 cursor-pointer"
          >
            <option value="recommended">Recomendados</option>
            <option value="rating">Mejor calificación</option>
            <option value="experience">Más experiencia</option>
            <option value="newest">Más recientes</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
        >
          Filtrar
        </button>

        <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="verified"
            value="1"
            defaultChecked={filters.verified}
            className="h-4 w-4 rounded border-gray-300 text-blue-700"
          />
          Solo verificados
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center justify-start md:justify-end gap-3 text-sm">
          <span className="text-gray-500">
            {resultCount} resultado{resultCount !== 1 ? 's' : ''}
            {locationLabel ? ` en ${locationLabel}` : ''}
          </span>
          <Link href={clearHref} className="font-semibold text-blue-700 hover:underline">
            Limpiar filtros
          </Link>
        </div>
      </form>
    </div>
  )
}
