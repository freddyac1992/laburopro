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
      className="hero-search grid grid-cols-1 md:grid-cols-[1.25fr_1fr_1fr_auto] gap-2 w-full max-w-5xl bg-white rounded-lg p-2"
      id="search-form"
    >
      <input
        id="search-query"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="¿Qué necesitas?"
        className="w-full min-h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        aria-label="Buscar servicio o detalle"
      />

      <select
        id="search-category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full min-h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        aria-label="Seleccionar categoría"
      >
        <option value="">¿Qué servicio necesitas?</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>

      <select
        id="search-city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full min-h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        aria-label="Seleccionar ciudad"
      >
        <option value="">¿En qué ciudad?</option>
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        id="search-submit-btn"
        className="min-h-12 px-7 bg-[#e85d3f] hover:bg-[#cf4f34] text-white font-bold rounded-md whitespace-nowrap"
      >
        Buscar
      </button>
    </form>
  )
}
