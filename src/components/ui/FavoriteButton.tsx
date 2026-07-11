'use client'

import { useSyncExternalStore } from 'react'
import {
  EMPTY_FAVORITES,
  getFavoriteProviders,
  subscribeToFavorites,
  toggleFavoriteProvider,
  type FavoriteProvider,
} from '@/lib/favorites'

export default function FavoriteButton({
  provider,
  showLabel = false,
  className = '',
}: {
  provider: FavoriteProvider
  showLabel?: boolean
  className?: string
}) {
  const favorites = useSyncExternalStore(
    subscribeToFavorites,
    getFavoriteProviders,
    () => EMPTY_FAVORITES
  )
  const isFavorite = favorites.some((item) => item.id === provider.id)
  const label = isFavorite ? 'Quitar de guardados' : 'Guardar proveedor'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isFavorite}
      onClick={() => toggleFavoriteProvider(provider)}
      className={`inline-flex items-center justify-center gap-2 border bg-white shadow-sm hover:border-red-300 focus-visible:outline-red-600 ${
        isFavorite ? 'border-red-200 text-red-600' : 'border-slate-200 text-slate-500'
      } ${className}`}
    >
      <span aria-hidden="true" className="text-xl leading-none">{isFavorite ? '♥' : '♡'}</span>
      {showLabel && <span className="text-sm font-semibold">{isFavorite ? 'Guardado' : 'Guardar'}</span>}
    </button>
  )
}
