import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type RateLimitAction = 'lead' | 'profile_view' | 'review' | 'provider_report'

const RETRY_AFTER_SECONDS: Record<RateLimitAction, number> = {
  lead: 600,
  profile_view: 3600,
  review: 3600,
  provider_report: 3600,
}

function getClientAddress(request: Request) {
  const cloudflareIp = request.headers.get('cf-connecting-ip')
  const realIp = request.headers.get('x-real-ip')
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return cloudflareIp?.trim() || realIp?.trim() || forwardedIp || 'unknown'
}

async function hashFingerprint(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function getRateLimitResponse(
  request: Request,
  supabase: SupabaseClient<Database>,
  action: RateLimitAction
) {
  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? 'unknown'
  const fingerprint = await hashFingerprint(`${getClientAddress(request)}|${userAgent}`)
  const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
    p_action: action,
    p_identifier_hash: fingerprint,
  })

  if (error) {
    return NextResponse.json(
      { message: 'La protección contra abuso no está disponible temporalmente.' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '60',
        },
      }
    )
  }

  if (allowed) return null

  return NextResponse.json(
    { message: 'Has realizado demasiadas solicitudes. Inténtalo nuevamente más tarde.' },
    {
      status: 429,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': String(RETRY_AFTER_SECONDS[action]),
      },
    }
  )
}
