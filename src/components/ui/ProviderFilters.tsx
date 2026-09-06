import Link from 'next/link'
import { Search, SlidersHorizontal, ShieldCheck, ChevronDown } from 'lucide-react'
import { CITIES } from '@/lib/constants'
import type { ProviderFilters as ProviderFiltersState } from '@/lib/provider-search'

interface ProviderFiltersProps {
  readonly filters: ProviderFiltersState
  readonly clearHref: string
  readonly resultCount?: number
  readonly locationLabel?: string
  readonly citySlug?: string
  readonly showCityFilter?: boolean
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
    <div className="mb-5 border-y border-slate-200 py-4">
      <form method="get" className="space-y-4">
        <div className={`grid grid-cols-1 gap-3 items-end ${showCityFilter ? 'md:grid-cols-[minmax(15rem,1fr)_minmax(12rem,0.65fr)_auto]' : 'md:grid-cols-[minmax(15rem,1fr)_auto]'}`}>
          <label htmlFor="provider-search-q" className="block text-sm font-bold text-gray-700">
            <span>¿Qué necesitas o a quién buscas?</span>
            <input id="provider-search-q" name="q" type="search" defaultValue={filters.q} placeholder="Ejemplo: gotera, Zona Sur o Juan" className="form-input mt-1.5 bg-white text-gray-900" />
          </label>

          {showCityFilter && (
            <label htmlFor="provider-search-city" className="block text-sm font-bold text-gray-700">
              <span>¿En qué ciudad?</span>
              <select id="provider-search-city" name="city" defaultValue={citySlug ?? ''} className="form-input mt-1.5 bg-white text-gray-900 cursor-pointer">
                <option value="">Toda Bolivia</option>
                {CITIES.map((city) => <option key={city.slug} value={city.slug}>{city.name}</option>)}
              </select>
            </label>
          )}

          <button type="submit" className="press-feedback min-h-12 inline-flex items-center justify-center gap-2 px-6 bg-teal-700 text-white font-extrabold rounded-md hover:bg-teal-800">
            <Search size={18} aria-hidden="true" />
            Buscar
          </button>
        </div>

        <details className="group border-t border-slate-200 pt-2">
          <summary className="min-h-12 flex items-center gap-2 cursor-pointer list-none text-sm font-bold text-teal-800 [&::-webkit-details-marker]:hidden"><SlidersHorizontal size={18} aria-hidden="true" />Más opciones de búsqueda<ChevronDown size={18} aria-hidden="true" className="ml-auto group-open:rotate-180" /></summary>
          <div className="grid sm:grid-cols-2 gap-4 pt-3 pb-2">
            <label htmlFor="provider-search-experience" className="block text-sm font-bold text-gray-700">
              <span>Años de experiencia</span>
              <select id="provider-search-experience" name="experience" defaultValue={filters.minExperience?.toString() ?? ''} className="form-input mt-1.5 bg-white text-gray-900 cursor-pointer">
                <option value="">Cualquier experiencia</option>
                <option value="1">Al menos 1 año</option>
                <option value="3">Al menos 3 años</option>
                <option value="5">Al menos 5 años</option>
                <option value="10">Al menos 10 años</option>
              </select>
            </label>
            <label htmlFor="provider-search-sort" className="block text-sm font-bold text-gray-700">
              <span>¿Cuáles quieres ver primero?</span>
              <select id="provider-search-sort" name="sort" defaultValue={filters.sort} className="form-input mt-1.5 bg-white text-gray-900 cursor-pointer">
                <option value="recommended">Los recomendados</option>
                <option value="rating">Los que tienen mejores opiniones</option>
                <option value="experience">Los que tienen más experiencia</option>
                <option value="newest">Los perfiles nuevos</option>
              </select>
            </label>
          </div>
          <label className="min-h-12 inline-flex items-center gap-3 cursor-pointer select-none font-bold text-slate-700">
            <input type="checkbox" name="verified" value="1" defaultChecked={filters.verified} className="h-5 w-5 accent-teal-700" />
            <span>Mostrar solamente identidades confirmadas</span>
          </label>
        </details>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
          <p className="flex items-start gap-2 font-medium text-green-800"><ShieldCheck size={18} className="shrink-0 mt-0.5" aria-hidden="true" />Solo mostramos perfiles revisados por LaburoPro.</p>
          {resultCount !== undefined && <div className="flex flex-wrap items-center gap-3" data-testid="search-result-summary">
            <span className="text-slate-500">
              {resultCount} resultado{resultCount !== 1 ? 's' : ''}
              {locationLabel ? ` en ${locationLabel}` : ''}
            </span>
            <Link href={clearHref} className="font-semibold text-[#e85d3f] hover:text-[#cf4f34] hover:underline">
              Empezar de nuevo
            </Link>
          </div>}
        </div>
      </form>
    </div>
  )
}
