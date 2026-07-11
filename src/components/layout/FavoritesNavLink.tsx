'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { EMPTY_FAVORITES, getFavoriteProviders, subscribeToFavorites } from '@/lib/favorites'

export default function FavoritesNavLink({ mobile = false, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const favorites = useSyncExternalStore(
    subscribeToFavorites,
    getFavoriteProviders,
    () => EMPTY_FAVORITES
  )

  return (
    <Link
      href="/guardados"
      onClick={onClick}
      className={mobile
        ? 'flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded-md font-medium'
        : 'inline-flex items-center gap-1.5 text-slate-600 hover:text-teal-700 font-semibold text-sm'
      }
    >
      <span>Guardados</span>
      {favorites.length > 0 && (
        <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-red-50 text-red-700 text-xs font-bold">
          {favorites.length}
        </span>
      )}
    </Link>
  )
}
