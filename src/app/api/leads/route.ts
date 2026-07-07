import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type LeadRequestBody = {
  providerId?: unknown
  message?: unknown
  source?: unknown
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

  const message =
    typeof body.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 500)
      : null
  const source =
    typeof body.source === 'string' && body.source.trim()
      ? body.source.trim().slice(0, 50)
      : 'whatsapp'

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    provider_id: providerId,
    customer_name: null,
    customer_phone: null,
    message,
    source,
  })

  if (error) {
    return NextResponse.json({ message: 'No se pudo registrar el contacto.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
