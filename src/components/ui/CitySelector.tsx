'use client'

import { useRouter } from 'next/navigation'
import { CITIES } from '@/lib/constants'

interface CitySelectorProps {
  currentCategory?: string
  currentCity?: string
  className?: string
}

export default function CitySelector({ currentCategory, currentCity, className = '' }: CitySelectorProps) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value
    if (!slug) return
    if (currentCategory) {
      router.push(`/servicios/${currentCategory}/${slug}`)
    } else {
      router.push(`/servicios/${slug}`)
    }
  }

  return (
    <select
      id="city-selector"
      value={currentCity ?? ''}
      onChange={handleChange}
      className={`form-input bg-white text-gray-900 cursor-pointer ${className}`}
      aria-label="Filtrar por ciudad"
    >
      <option value="">Todas las ciudades</option>
      {CITIES.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
