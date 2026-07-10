'use client'

import { useEffect } from 'react'

const VIEW_DEDUPLICATION_MS = 30 * 60 * 1000
const trackedInMemory = new Set<string>()

function getVisitorId() {
  const storageKey = 'laburopro_visitor_id'
  const existing = window.localStorage.getItem(storageKey)
  if (existing) return existing

  const visitorId = crypto.randomUUID()
  window.localStorage.setItem(storageKey, visitorId)
  return visitorId
}

export default function ProfileViewTracker({ providerId }: { providerId: string }) {
  useEffect(() => {
    const deduplicationKey = `laburopro_profile_view_${providerId}`
    if (trackedInMemory.has(deduplicationKey)) return

    try {
      const lastTrackedAt = Number(window.localStorage.getItem(deduplicationKey) ?? 0)
      if (Date.now() - lastTrackedAt < VIEW_DEDUPLICATION_MS) return

      trackedInMemory.add(deduplicationKey)
      window.localStorage.setItem(deduplicationKey, String(Date.now()))

      void fetch('/api/profile-views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          providerId,
          visitorId: getVisitorId(),
          pageUrl: window.location.href,
          referrer: document.referrer || null,
        }),
        keepalive: true,
      })
    } catch {
      trackedInMemory.add(deduplicationKey)
      void fetch('/api/profile-views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ providerId }),
        keepalive: true,
      })
    }
  }, [providerId])

  return null
}
