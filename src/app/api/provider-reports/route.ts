import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_REASONS = new Set([
  'no_responde',
  'datos_falsos',
  'mal_servicio',
  'cobro_indebido',
  'comportamiento_inadecuado',
  'otro',
])

type ReportRequestBody = {
  providerId?: unknown
  reason?: unknown
  details?: unknown
  reporterName?: unknown
  reporterContact?: unknown
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : null
}

export async function POST(request: Request) {
  let body: ReportRequestBody

  try {
    body = (await request.json()) as ReportRequestBody
  } catch {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 })
  }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : ''
  const reason = cleanText(body.reason, 60)
  const details = cleanText(body.details, 900)
  const reporterName = cleanText(body.reporterName, 80)
  const reporterContact = cleanText(body.reporterContact, 120)

  if (!providerId) {
    return NextResponse.json({ message: 'Falta el proveedor.' }, { status: 400 })
  }

  if (!reason || !VALID_REASONS.has(reason)) {
    return NextResponse.json({ message: 'Selecciona un motivo válido.' }, { status: 400 })
  }

  if (!details || details.length < 10) {
    return NextResponse.json({ message: 'Agrega más detalles para que podamos revisar el caso.' }, { status: 400 })
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

  const { error } = await supabase.from('provider_reports').insert({
    provider_id: providerId,
    reason,
    details,
    reporter_name: reporterName,
    reporter_contact: reporterContact,
  })

  if (error) {
    return NextResponse.json({ message: 'No se pudo registrar el reporte.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
