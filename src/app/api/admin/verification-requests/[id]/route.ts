import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'verification-documents'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Inicia sesión nuevamente.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.json({ message: 'No tienes permiso para revisar solicitudes.' }, { status: 403 })

  let body: { decision?: unknown; reason?: unknown }
  try {
    body = await request.json() as { decision?: unknown; reason?: unknown }
  } catch {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 })
  }

  const decision = body.decision
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (decision !== 'approved' && decision !== 'rejected' && decision !== 'revoked') {
    return NextResponse.json({ message: 'Elige una decisión válida.' }, { status: 400 })
  }
  if ((decision === 'rejected' || decision === 'revoked') && (reason.length < 5 || reason.length > 300)) {
    return NextResponse.json({ message: 'Explica la decisión en 5 a 300 caracteres.' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ message: 'Falta configurar la clave privada de Supabase.' }, { status: 503 })

  const { id } = await params
  const { data, error } = await admin.rpc('review_verification_request', {
    p_request_id: id,
    p_reviewer_id: user.id,
    p_decision: decision,
    p_review_note: decision === 'rejected' || decision === 'revoked' ? reason : null,
  })
  if (error) return NextResponse.json({ message: 'No pudimos aplicar la decisión. Actualiza la lista para comprobar si la solicitud ya fue revisada.' }, { status: 409 })

  const paths = [data?.[0]?.front_path, data?.[0]?.back_path].filter((path): path is string => Boolean(path))
  const cleanup = paths.length === 0 ? null : await admin.storage.from(BUCKET).remove(paths)
  return NextResponse.json({ status: decision, documentsDeleted: !cleanup?.error })
}
