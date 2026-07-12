'use client'

import { useState } from 'react'
import StarRating from './StarRating'

interface ReviewFormProps {
  providerId: string
  providerName: string
}

export default function ReviewForm({ providerId, providerName }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [reviewerName, setReviewerName] = useState('')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setError(null)

    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        rating,
        reviewerName,
        comment,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as { message?: string }

    if (!response.ok) {
      setError(payload.message ?? 'No se pudo enviar la reseña.')
      setStatus('idle')
      return
    }

    setStatus('success')
    setReviewerName('')
    setComment('')
    setRating(5)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-2">Dejar una reseña</h2>
      <p className="text-sm text-gray-500 mb-4">
        Tu reseña será revisada antes de publicarse en el perfil de {providerName}.
      </p>

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm mb-4">
          Gracias. Recibimos tu reseña y quedará visible cuando sea aprobada.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-1.5">
            Calificación
          </legend>
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size="lg" label="Calificación de la reseña" />
            <span className="text-sm font-semibold text-slate-600" aria-live="polite">
              {rating} de 5
            </span>
          </div>
        </fieldset>

        <div>
          <label htmlFor="reviewer-name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Tu nombre
          </label>
          <input
            id="reviewer-name"
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            placeholder="Opcional"
            className="form-input bg-white text-gray-900"
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1.5">
            Comentario
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            required
            minLength={10}
            maxLength={700}
            rows={4}
            placeholder="Cuenta cómo fue tu experiencia"
            className="form-input bg-white text-gray-900 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-full px-5 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-60"
        >
          {status === 'saving' ? 'Enviando...' : 'Enviar reseña'}
        </button>
      </form>
    </div>
  )
}
