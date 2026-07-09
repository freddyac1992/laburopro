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
      className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl"
      id="search-form"
    >
      <input
        id="search-query"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="¿Qué necesitas?"
        className="form-input flex-1 bg-white text-gray-900"
        aria-label="Buscar servicio o detalle"
      />

      <select
        id="search-category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="form-input flex-1 bg-white text-gray-900 cursor-pointer"
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
        className="form-input flex-1 bg-white text-gray-900 cursor-pointer"
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
        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
      >
        Buscar
      </button>
    </form>
  )
}
