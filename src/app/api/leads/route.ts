import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitResponse } from '@/lib/rate-limit'
import { sendNewLeadNotification } from '@/lib/email/lead-notification'

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>

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

async function insertLead(
  adminSupabase: AdminClient,
  enrichedLead: {
    provider_id: string
    customer_name: null
    customer_phone: null
    message: string | null
    source: string
    page_url: string | null
    referrer: string | null
    user_agent: string | null
    metadata: { tracked_at: string }
  },
) {
  const { data, error } = await adminSupabase
    .from('leads')
    .insert(enrichedLead)
    .select('id')
    .single()

  if (!error) return { leadId: data.id, degraded: false }
  if (error.code !== 'PGRST204') return null

  const { data: fallbackLead, error: fallbackError } = await adminSupabase
    .from('leads')
    .insert({
      provider_id: enrichedLead.provider_id,
      customer_name: null,
      customer_phone: null,
      message: enrichedLead.message,
      source: enrichedLead.source,
    })
    .select('id')
    .single()

  return fallbackError ? null : { leadId: fallbackLead.id, degraded: true }
}

async function notifyProvider(
  adminSupabase: AdminClient,
  providerId: string,
  leadId: string,
  message: string | null,
) {
  const { data: providerOwner } = await adminSupabase
    .from('provider_profiles')
    .select('display_name, user_id')
    .eq('id', providerId)
    .maybeSingle()

  if (!providerOwner) return 'skipped' as const

  const { data: ownerProfile } = await adminSupabase
    .from('profiles')
    .select('email')
    .eq('id', providerOwner.user_id)
    .maybeSingle()

  if (!ownerProfile?.email) return 'skipped' as const

  return sendNewLeadNotification({
    leadId,
    providerEmail: ownerProfile.email,
    providerName: providerOwner.display_name,
    message,
  })
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

  const rateLimitResponse = await getRateLimitResponse(request, adminSupabase, 'lead')
  if (rateLimitResponse) return rateLimitResponse

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

  const insertedLead = await insertLead(adminSupabase, enrichedLead)
  if (!insertedLead) {
    return NextResponse.json({ message: 'No se pudo registrar el contacto.' }, { status: 500 })
  }

  const notification: 'sent' | 'skipped' | 'failed' = await notifyProvider(
    adminSupabase,
    providerId,
    insertedLead.leadId,
    message,
  )

  return NextResponse.json({ ok: true, degraded: insertedLead.degraded, notification })
}
