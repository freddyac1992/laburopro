'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CATEGORIES, CITIES } from '@/lib/constants'

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }

    const suffix = params.toString() ? `?${params.toString()}` : ''

    if (category && city) {
      router.push(`/servicios/${category}/${city}${suffix}`)
    } else if (category) {
      router.push(`/servicios/${category}${suffix}`)
    } else {
      if (city) {
        params.set('city', city)
      }
      const globalSuffix = params.toString() ? `?${params.toString()}` : ''
      router.push(`/servicios${globalSuffix}`)
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="hero-search w-full max-w-4xl bg-white rounded-lg p-4 text-left"
      id="search-form"
      aria-labelledby="buscar-trabajador"
    >
      <h2 id="buscar-trabajador" className="text-lg font-extrabold text-[#102a33] mb-1">Busca un trabajador</h2>
      <p className="text-sm text-slate-600 mb-4">Elige qué trabajo necesitas y dónde estás.</p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="block text-sm font-bold text-slate-700">
          ¿Qué trabajo necesitas?
          <select
            id="search-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full min-h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
          >
            <option value="">Todos los trabajos</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold text-slate-700">
          ¿En qué ciudad estás?
          <select
            id="search-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1.5 w-full min-h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
          >
            <option value="">Toda Bolivia</option>
            {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>

        <button
          type="submit"
          id="search-submit-btn"
          className="min-h-12 px-7 bg-[#e85d3f] hover:bg-[#cf4f34] text-white font-extrabold rounded-md whitespace-nowrap"
        >
          Ver trabajadores
        </button>
      </div>

      <details className="mt-3 text-slate-700">
        <summary className="min-h-11 inline-flex items-center cursor-pointer text-sm font-bold text-teal-800">Buscar por nombre, zona o detalle</summary>
        <label htmlFor="search-query" className="block text-sm font-medium mt-2 mb-1.5">Escribe algo que te ayude a encontrarlo</label>
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ejemplo: gotera, Zona Sur o Juan"
          className="w-full min-h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        />
      </details>
    </form>
  )
}
