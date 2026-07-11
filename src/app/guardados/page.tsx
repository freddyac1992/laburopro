'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import ProviderCard from '@/components/ui/ProviderCard'
import { EMPTY_FAVORITES, getFavoriteProviders, subscribeToFavorites } from '@/lib/favorites'

export default function SavedProvidersPage() {
  const favorites = useSyncExternalStore(
    subscribeToFavorites,
    getFavoriteProviders,
    () => EMPTY_FAVORITES
  )

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
      <div className="mb-8">
        <p className="text-sm font-semibold text-teal-700 mb-2">Tu selección</p>
        <h1 className="text-3xl font-bold text-slate-900">Proveedores guardados</h1>
        <p className="text-slate-600 mt-2">Compara opciones y vuelve a contactar cuando estés listo.</p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {favorites.map((provider) => (
            <ProviderCard key={provider.id} {...provider} />
          ))}
        </div>
      ) : (
        <div className="border border-slate-200 bg-white rounded-lg px-6 py-14 text-center">
          <div className="text-4xl text-slate-300 mb-4" aria-hidden="true">♡</div>
          <h2 className="text-lg font-semibold text-slate-900">Todavía no guardaste proveedores</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">Usa el corazón de una tarjeta o perfil para armar tu lista.</p>
          <Link href="/servicios" className="inline-flex px-5 py-2.5 rounded-md bg-teal-700 text-white font-semibold hover:bg-teal-800">
            Explorar servicios
          </Link>
        </div>
      )}
    </main>
  )
}
