export type FavoriteProvider = {
  id: string
  slug: string
  displayName: string
  categoryName?: string
  cityName?: string
  zone?: string | null
  description?: string | null
  priceReference?: string | null
  rating?: number
  reviewCount?: number
  isVerified?: boolean
  yearsExperience?: number | null
  profilePhotoPath?: string | null
  imageVersion?: string
}

const STORAGE_KEY = 'laburopro:favorites:v1'
export const FAVORITES_EVENT = 'laburopro:favorites-changed'
export const EMPTY_FAVORITES: FavoriteProvider[] = []

let cachedValue: string | null | undefined
let cachedFavorites = EMPTY_FAVORITES

export function getFavoriteProviders() {
  if (typeof window === 'undefined') return EMPTY_FAVORITES

  const value = window.localStorage.getItem(STORAGE_KEY)
  if (value === cachedValue) return cachedFavorites

  cachedValue = value
  if (!value) {
    cachedFavorites = EMPTY_FAVORITES
    return cachedFavorites
  }

  try {
    const parsed = JSON.parse(value) as unknown
    cachedFavorites = Array.isArray(parsed)
      ? parsed.filter((item): item is FavoriteProvider => (
          typeof item === 'object' && item !== null &&
          typeof (item as FavoriteProvider).id === 'string' &&
          typeof (item as FavoriteProvider).slug === 'string' &&
          typeof (item as FavoriteProvider).displayName === 'string'
        ))
      : EMPTY_FAVORITES
  } catch {
    cachedFavorites = EMPTY_FAVORITES
  }

  return cachedFavorites
}

export function subscribeToFavorites(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(FAVORITES_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(FAVORITES_EVENT, callback)
  }
}

export function toggleFavoriteProvider(provider: FavoriteProvider) {
  const favorites = getFavoriteProviders()
  const next = favorites.some((item) => item.id === provider.id)
    ? favorites.filter((item) => item.id !== provider.id)
    : [provider, ...favorites.filter((item) => item.id !== provider.id)].slice(0, 50)

  const serialized = JSON.stringify(next)
  window.localStorage.setItem(STORAGE_KEY, serialized)
  cachedValue = serialized
  cachedFavorites = next
  window.dispatchEvent(new Event(FAVORITES_EVENT))
}
