import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitResponse } from '@/lib/rate-limit'

type ProfileViewRequestBody = {
  providerId?: unknown
  visitorId?: unknown
  pageUrl?: unknown
  referrer?: unknown
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : null
}

export async function POST(request: Request) {
  let body: ProfileViewRequestBody

  try {
    body = (await request.json()) as ProfileViewRequestBody
  } catch {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 })
  }

  const providerId = cleanText(body.providerId, 100)
  if (!providerId) {
    return NextResponse.json({ message: 'Falta el proveedor.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('id, user_id')
    .eq('id', providerId)
    .eq('is_approved', true)
    .eq('is_active', true)
    .maybeSingle()

  if (!provider) {
    return NextResponse.json({ message: 'Proveedor no encontrado.' }, { status: 404 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === provider.user_id) {
    return NextResponse.json({ ok: true, ignored: 'owner' })
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'admin') {
      return NextResponse.json({ ok: true, ignored: 'admin' })
    }
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return NextResponse.json({ message: 'El servicio no está configurado temporalmente.' }, { status: 503 })
  }

  const rateLimitResponse = await getRateLimitResponse(request, adminSupabase, 'profile_view')
  if (rateLimitResponse) return rateLimitResponse

  const { error } = await adminSupabase.from('profile_views').insert({
    provider_id: providerId,
    visitor_id: cleanText(body.visitorId, 100),
    page_url: cleanText(body.pageUrl, 1000),
    referrer: cleanText(body.referrer, 1000) ?? cleanText(request.headers.get('referer'), 1000),
    user_agent: cleanText(request.headers.get('user-agent'), 500),
  })

  if (error) {
    return NextResponse.json({ message: 'No se pudo registrar la visita.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
