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
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 mb-6 shadow-sm">
      <form method="get" className="space-y-4">
        <div className={`grid grid-cols-1 gap-3 items-end ${showCityFilter ? 'md:grid-cols-2 lg:grid-cols-[minmax(15rem,1fr)_auto_auto_auto_auto]' : 'md:grid-cols-[minmax(15rem,1fr)_auto_auto_auto]'}`}>
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
            className="h-[42px] px-5 bg-teal-700 text-white font-semibold rounded-md hover:bg-teal-800 transition-colors"
          >
            Aplicar filtros
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="verified"
                value="1"
                defaultChecked={filters.verified}
                className="peer sr-only"
              />
              <span className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-teal-700 transition-colors after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" />
              <span className="text-sm font-semibold text-slate-700">Solo verificados</span>
            </label>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700" title="Los perfiles pendientes no aparecen en búsquedas públicas">
              <span aria-hidden="true">✓</span> Todos aprobados
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              {resultCount} resultado{resultCount !== 1 ? 's' : ''}
              {locationLabel ? ` en ${locationLabel}` : ''}
            </span>
            <Link href={clearHref} className="font-semibold text-[#e85d3f] hover:text-[#cf4f34] hover:underline">
              Limpiar filtros
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
