import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'verification-documents'
const MAX_FILE_SIZE = 1024 * 1024

function getDocument(formData: FormData, key: string, required: boolean) {
  const value = formData.get(key)
  if (!(value instanceof File) || value.size === 0) {
    return required ? { error: 'Falta una fotografía del documento.' } : { file: null }
  }
  if (value.type !== 'image/webp') return { error: 'El documento debe enviarse como una imagen WebP.' }
  if (value.size > MAX_FILE_SIZE) return { error: 'Cada imagen debe pesar menos de 1 MB.' }
  return { file: value }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Tu sesión expiró. Vuelve a iniciar sesión.' }, { status: 401 })

  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!provider) return NextResponse.json({ message: 'Primero debes crear tu perfil de trabajo.' }, { status: 409 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ message: 'No pudimos leer los archivos enviados.' }, { status: 400 })
  }

  const legalName = String(formData.get('legal_name') ?? '').trim()
  const documentType = formData.get('document_type')
  const consent = formData.get('consent') === 'true'
  if (legalName.length < 2 || legalName.length > 120) {
    return NextResponse.json({ message: 'Escribe tu nombre completo como aparece en el documento.' }, { status: 400 })
  }
  if (documentType !== 'ci' && documentType !== 'passport') {
    return NextResponse.json({ message: 'Elige un tipo de documento válido.' }, { status: 400 })
  }
  if (!consent) return NextResponse.json({ message: 'Debes aceptar el uso de los documentos para verificar tu identidad.' }, { status: 400 })

  const frontResult = getDocument(formData, 'front', true)
  const backResult = getDocument(formData, 'back', documentType === 'ci')
  if (frontResult.error || backResult.error) {
    return NextResponse.json({ message: frontResult.error ?? backResult.error }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ message: 'La verificación no está configurada todavía.' }, { status: 503 })

  const { data: existing } = await admin
    .from('verification_requests')
    .select('status, document_front_path, document_back_path')
    .eq('provider_id', provider.id)
    .maybeSingle()

  if (existing?.status === 'pending') {
    return NextResponse.json({ message: 'Tu solicitud ya está esperando revisión.' }, { status: 409 })
  }
  if (existing?.status === 'approved') {
    return NextResponse.json({ message: 'Tu identidad ya está confirmada.' }, { status: 409 })
  }

  const frontPath = `${user.id}/front.webp`
  const backPath = documentType === 'ci' ? `${user.id}/back.webp` : null
  const files = [frontPath, backPath].filter((path): path is string => Boolean(path))
  const oldFiles = [existing?.document_front_path, existing?.document_back_path]
    .filter((path): path is string => Boolean(path))
  if (oldFiles.length > 0) await admin.storage.from(BUCKET).remove(oldFiles)

  const frontUpload = await admin.storage.from(BUCKET).upload(frontPath, frontResult.file!, {
    contentType: 'image/webp',
    cacheControl: '0',
    upsert: true,
  })
  if (frontUpload.error) {
    return NextResponse.json({ message: 'No pudimos guardar el frente del documento.' }, { status: 500 })
  }

  if (backPath && backResult.file) {
    const backUpload = await admin.storage.from(BUCKET).upload(backPath, backResult.file, {
      contentType: 'image/webp',
      cacheControl: '0',
      upsert: true,
    })
    if (backUpload.error) {
      await admin.storage.from(BUCKET).remove(files)
      return NextResponse.json({ message: 'No pudimos guardar el reverso del documento.' }, { status: 500 })
    }
  }

  const { error: saveError } = await admin.from('verification_requests').upsert({
    provider_id: provider.id,
    user_id: user.id,
    legal_name: legalName,
    document_type: documentType,
    document_front_path: frontPath,
    document_back_path: backPath,
    status: 'pending',
    review_note: null,
    submitted_at: new Date().toISOString(),
    consented_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
  }, { onConflict: 'provider_id' })

  if (saveError) {
    await admin.storage.from(BUCKET).remove(files)
    return NextResponse.json({ message: 'No pudimos crear la solicitud de verificación.' }, { status: 500 })
  }

  await admin.from('provider_profiles').update({ is_verified: false }).eq('id', provider.id)
  return NextResponse.json({ status: 'pending' })
}
