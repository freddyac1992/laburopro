import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Inicia sesión nuevamente.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.json({ message: 'No tienes permiso para ver documentos.' }, { status: 403 })

  const side = new URL(request.url).searchParams.get('side')
  if (side !== 'front' && side !== 'back') {
    return NextResponse.json({ message: 'Documento inválido.' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ message: 'Falta configurar la clave privada de Supabase.' }, { status: 503 })

  const { id } = await params
  const { data: verification } = await admin
    .from('verification_requests')
    .select('document_front_path, document_back_path, status')
    .eq('id', id)
    .eq('status', 'pending')
    .maybeSingle()
  const path = side === 'front' ? verification?.document_front_path : verification?.document_back_path
  if (typeof path !== 'string') return NextResponse.json({ message: 'El documento ya no está disponible.' }, { status: 404 })

  const { data, error } = await admin.storage.from('verification-documents').createSignedUrl(path, 120)
  if (error || !data?.signedUrl) return NextResponse.json({ message: 'No pudimos abrir el documento.' }, { status: 500 })

  const response = NextResponse.redirect(data.signedUrl)
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}
