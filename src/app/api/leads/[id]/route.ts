import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadStatus } from '@/types/database'

const VALID_STATUSES = new Set<LeadStatus>(['new', 'contacted', 'converted', 'lost'])

type UpdateLeadBody = {
  status?: unknown
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  let body: UpdateLeadBody

  try {
    body = (await request.json()) as UpdateLeadBody
  } catch {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 })
  }

  const status = typeof body.status === 'string' ? body.status as LeadStatus : null
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ message: 'Selecciona un estado válido.' }, { status: 400 })
  }

  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Tu sesión expiró. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!provider) {
    return NextResponse.json({ message: 'No tienes un perfil de proveedor.' }, { status: 403 })
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('provider_id', provider.id)
    .select('id, status, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ message: 'No se pudo actualizar el contacto.' }, { status: 500 })
  }

  if (!lead) {
    return NextResponse.json({ message: 'Contacto no encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ lead })
}
