import { createClient } from '@/lib/supabase/server'
import type { ProviderProfile } from '@/types/database'

export type ProviderListItem = ProviderProfile & {
  category: { name: string; slug: string } | null
  city: { name: string; slug: string } | null
}

export type ProviderSort = 'recommended' | 'rating' | 'experience' | 'newest'

export type ProviderFilters = {
  q: string
  verified: boolean
  minExperience: number | null
  sort: ProviderSort
}

export type SearchParamValue = string | string[] | undefined
export type SearchParams = Record<string, SearchParamValue>

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeText(value: SearchParamValue, maxLength: number) {
  return (firstParam(value) ?? '').trim().slice(0, maxLength)
}

function normalizeSort(value: SearchParamValue): ProviderSort {
  const sort = firstParam(value)
  if (sort === 'rating' || sort === 'experience' || sort === 'newest') {
    return sort
  }

  return 'recommended'
}

export function parseProviderFilters(searchParams: SearchParams): ProviderFilters {
  const minExperienceValue = Number.parseInt(firstParam(searchParams.experience) ?? '', 10)

  return {
    q: normalizeText(searchParams.q, 80),
    verified: firstParam(searchParams.verified) === '1',
    minExperience: Number.isFinite(minExperienceValue) && minExperienceValue > 0 ? minExperienceValue : null,
    sort: normalizeSort(searchParams.sort),
  }
}

export function hasActiveProviderFilters(filters: ProviderFilters) {
  return Boolean(filters.q || filters.verified || filters.minExperience || filters.sort !== 'recommended')
}

export async function searchProviders({
  categorySlug,
  citySlug,
  filters,
  limit = 48,
}: {
  categorySlug?: string
  citySlug?: string
  filters: ProviderFilters
  limit?: number
}) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('provider_profiles')
      .select('*, category:categories!inner(name, slug), city:cities!inner(name, slug)')
      .eq('is_approved', true)
      .eq('is_active', true)

    if (categorySlug) {
      query = query.eq('category.slug', categorySlug)
    }

    if (citySlug) {
      query = query.eq('city.slug', citySlug)
    }

    if (filters.q) {
      const q = filters.q.replaceAll('%', '').replaceAll(',', ' ')
      query = query.or(
        `display_name.ilike.%${q}%,description.ilike.%${q}%,zone.ilike.%${q}%,price_reference.ilike.%${q}%`
      )
    }

    if (filters.verified) {
      query = query.eq('is_verified', true)
    }

    if (filters.minExperience) {
      query = query.gte('years_experience', filters.minExperience)
    }

    if (filters.sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (filters.sort === 'experience') {
      query = query.order('years_experience', { ascending: false, nullsFirst: false })
    } else if (filters.sort === 'rating') {
      query = query.order('rating', { ascending: false }).order('review_count', { ascending: false })
    } else {
      query = query
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
    }

    const { data } = await query.limit(limit)
    return (data ?? []) as unknown as ProviderListItem[]
  } catch {
    return []
  }
}
