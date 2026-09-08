'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { SITE_URL } from '@/lib/constants'

export default function ProfileShareButton({ slug, name }: Readonly<{ slug: string; name: string }>) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const url = `${SITE_URL}/proveedores/${encodeURIComponent(slug)}`

  async function share() {
    setBusy(true)
    setMessage('')
    setShowLink(false)
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} en LaburoPro`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setMessage('Enlace copiado. Ya puedes pegarlo en WhatsApp o Facebook.')
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setShowLink(true)
        setMessage('No pudimos compartir automáticamente. Puedes seleccionar y copiar este enlace.')
      }
    } finally {
      setBusy(false)
    }
  }

  return <div className="max-w-full">
    <button type="button" onClick={share} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"><Share2 size={17} aria-hidden="true" />{busy ? 'Compartiendo…' : 'Compartir mi perfil'}</button>
    <p role="status" className="mt-2 max-w-sm text-sm text-gray-600 empty:hidden">{message}</p>
    {showLink && <input aria-label="Enlace de tu perfil" value={url} readOnly onFocus={(event) => event.target.select()} className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />}
  </div>
}
