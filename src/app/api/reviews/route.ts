import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitResponse } from '@/lib/rate-limit'

type ReviewRequestBody = {
  providerId?: unknown
  rating?: unknown
  comment?: unknown
  reviewerName?: unknown
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : null
}

export async function POST(request: Request) {
  let body: ReviewRequestBody

  try {
    body = (await request.json()) as ReviewRequestBody
  } catch {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 })
  }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : ''
  const rating = typeof body.rating === 'number' ? body.rating : Number(body.rating)
  const reviewerName = cleanText(body.reviewerName, 80)
  const comment = cleanText(body.comment, 700)

  if (!providerId) {
    return NextResponse.json({ message: 'Falta el proveedor.' }, { status: 400 })
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ message: 'La calificación debe estar entre 1 y 5.' }, { status: 400 })
  }

  if (!comment || comment.length < 10) {
    return NextResponse.json({ message: 'Cuéntanos un poco más sobre tu experiencia.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('id', providerId)
    .eq('is_approved', true)
    .eq('is_active', true)
    .maybeSingle()

  if (!provider) {
    return NextResponse.json({ message: 'Proveedor no encontrado.' }, { status: 404 })
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return NextResponse.json({ message: 'El servicio no está configurado temporalmente.' }, { status: 503 })
  }

  const rateLimitResponse = await getRateLimitResponse(request, adminSupabase, 'review')
  if (rateLimitResponse) return rateLimitResponse

  const { error } = await adminSupabase.from('reviews').insert({
    provider_id: providerId,
    rating,
    comment,
    reviewer_name: reviewerName,
  })

  if (error) {
    return NextResponse.json({ message: 'No se pudo registrar la reseña.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
