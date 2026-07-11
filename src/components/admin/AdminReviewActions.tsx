'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StarRating from '@/components/ui/StarRating'

type ReviewStatus = 'pending' | 'approved'

export type AdminReview = {
  id: string
  provider_id: string | null
  rating: number
  comment: string | null
  reviewer_name: string | null
  is_approved: boolean
  created_at: string
  provider: {
    display_name: string | null
    slug: string | null
    category: { name: string | null } | null
    city: { name: string | null } | null
  } | null
}

interface AdminReviewActionsProps {
  initialReviews: AdminReview[]
}

async function recalculateProviderRating(providerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('provider_id', providerId)
    .eq('is_approved', true)

  if (error) {
    throw error
  }

  const ratings = data ?? []
  const reviewCount = ratings.length
  const rating =
    reviewCount > 0
      ? Number((ratings.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(2))
      : 0

  const { error: updateError } = await supabase
    .from('provider_profiles')
    .update({
      rating,
      review_count: reviewCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', providerId)

  if (updateError) {
    throw updateError
  }
}

export default function AdminReviewActions({ initialReviews }: AdminReviewActionsProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [filter, setFilter] = useState<ReviewStatus>('pending')
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = useMemo(
    () => reviews.filter((review) => (filter === 'pending' ? !review.is_approved : review.is_approved)),
    [filter, reviews]
  )

  async function approveReview(review: AdminReview) {
    if (!review.provider_id) return
    setSaving(review.id)
    setError(null)

    const { error: updateError } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', review.id)

    if (updateError) {
      setError(`No se pudo aprobar la reseña: ${updateError.message}`)
      setSaving(null)
      return
    }

    try {
      await recalculateProviderRating(review.provider_id)
      setReviews((prev) =>
        prev.map((item) => (item.id === review.id ? { ...item, is_approved: true } : item))
      )
    } catch (ratingError) {
      setError(ratingError instanceof Error ? ratingError.message : 'No se pudo recalcular la calificación.')
    }

    setSaving(null)
  }

  async function rejectReview(review: AdminReview) {
    setSaving(review.id)
    setError(null)

    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review.id)

    if (deleteError) {
      setError(`No se pudo eliminar la reseña: ${deleteError.message}`)
    } else {
      if (review.provider_id && review.is_approved) {
        try {
          await recalculateProviderRating(review.provider_id)
        } catch (ratingError) {
          setError(ratingError instanceof Error ? ratingError.message : 'No se pudo recalcular la calificación.')
        }
      }
      setReviews((prev) => prev.filter((item) => item.id !== review.id))
    }

    setSaving(null)
  }

  const tabs = [
    { id: 'pending' as const, label: 'Pendientes', count: reviews.filter((review) => !review.is_approved).length },
    { id: 'approved' as const, label: 'Aprobadas', count: reviews.filter((review) => review.is_approved).length },
  ]

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              filter === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">⭐</div>
          <p>No hay reseñas {filter === 'pending' ? 'pendientes' : 'aprobadas'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-gray-900">
                      {review.provider?.display_name ?? 'Proveedor eliminado'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-md">
                      <StarRating value={review.rating} size="sm" label="Calificación de la reseña" />
                      <span className="text-xs font-semibold text-amber-800">{review.rating}/5</span>
                    </span>
                    {review.is_approved && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Aprobada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {[review.provider?.category?.name, review.provider?.city?.name].filter(Boolean).join(' · ') || 'Sin categoría'}
                    {' · '}
                    {new Date(review.created_at).toLocaleDateString('es-BO')}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Autor: {review.reviewer_name ?? 'Cliente de LaburoPro'}
                  </p>
                  {review.comment && (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{review.comment}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                  {review.provider?.slug && (
                    <Link
                      href={`/proveedores/${review.provider.slug}?preview=admin`}
                      target="_blank"
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      Ver perfil
                    </Link>
                  )}

                  {!review.is_approved && (
                    <button
                      disabled={saving === review.id}
                      onClick={() => approveReview(review)}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving === review.id ? '...' : 'Aprobar'}
                    </button>
                  )}

                  <button
                    disabled={saving === review.id}
                    onClick={() => rejectReview(review)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                  >
                    {saving === review.id ? '...' : review.is_approved ? 'Eliminar' : 'Rechazar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
