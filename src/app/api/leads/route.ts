import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type LeadRequestBody = {
  providerId?: unknown
  message?: unknown
  source?: unknown
  pageUrl?: unknown
  referrer?: unknown
  userAgent?: unknown
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : null
}

export async function POST(request: Request) {
  let body: LeadRequestBody

  try {
    body = (await request.json()) as LeadRequestBody
  } catch {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 })
  }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : ''
  if (!providerId) {
    return NextResponse.json({ message: 'Falta el proveedor.' }, { status: 400 })
  }

  const message = cleanText(body.message, 500)
  const source = cleanText(body.source, 50) ?? 'whatsapp'
  const pageUrl = cleanText(body.pageUrl, 1000)
  const referrer = cleanText(body.referrer, 1000) ?? cleanText(request.headers.get('referer'), 1000)
  const userAgent = cleanText(body.userAgent, 500) ?? cleanText(request.headers.get('user-agent'), 500)

  const supabase = await createClient()
  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('id', providerId)
    .maybeSingle()

  if (!provider) {
    return NextResponse.json({ message: 'Proveedor no encontrado.' }, { status: 404 })
  }

  const enrichedLead = {
    provider_id: providerId,
    customer_name: null,
    customer_phone: null,
    message,
    source,
    page_url: pageUrl,
    referrer,
    user_agent: userAgent,
    metadata: {
      tracked_at: new Date().toISOString(),
    },
  }

  const { error } = await supabase.from('leads').insert(enrichedLead)

  if (error && error.code === 'PGRST204') {
    const { error: fallbackError } = await supabase.from('leads').insert({
      provider_id: providerId,
      customer_name: null,
      customer_phone: null,
      message,
      source,
    })

    if (!fallbackError) {
      return NextResponse.json({ ok: true, degraded: true })
    }
  }

  if (error) {
    return NextResponse.json({ message: 'No se pudo registrar el contacto.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
