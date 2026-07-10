import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

type ProviderProfileRequestBody = {
  display_name?: unknown
  category_id?: unknown
  city_id?: unknown
  zone?: unknown
  description?: unknown
  services?: unknown
  years_experience?: unknown
  price_reference?: unknown
  whatsapp?: unknown
  availability?: unknown
  profile_photo_path?: unknown
  work_photo_path?: unknown
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function resolveReferenceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: 'categories' | 'cities',
  value: string | null
) {
  if (!value) return null

  const { data } = await supabase
    .from(table)
    .select('id')
    .eq(looksLikeUuid(value) ? 'id' : 'slug', value)
    .maybeSingle()

  return data?.id ?? null
}

export async function POST(request: Request) {
  let body: ProviderProfileRequestBody

  try {
    body = (await request.json()) as ProviderProfileRequestBody
  } catch {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 })
  }

  const displayName = optionalString(body.display_name)
  const whatsapp = optionalString(body.whatsapp)

  if (!displayName) {
    return NextResponse.json({ message: 'El nombre es obligatorio.' }, { status: 400 })
  }

  if (!whatsapp) {
    return NextResponse.json({ message: 'El número de WhatsApp es obligatorio.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Tu sesión expiró. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const { data: profile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileLookupError) {
    return NextResponse.json({ message: profileLookupError.message }, { status: 500 })
  }

  if (!profile) {
    const { error: profileInsertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email ?? null,
      full_name:
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : null,
      role: 'provider',
    })

    if (profileInsertError) {
      return NextResponse.json({ message: profileInsertError.message }, { status: 500 })
    }
  }

  const services = Array.isArray(body.services)
    ? body.services.filter((service): service is string => typeof service === 'string' && Boolean(service.trim()))
    : null

  const yearsExperience =
    typeof body.years_experience === 'number' && Number.isFinite(body.years_experience)
      ? body.years_experience
      : null

  const [categoryId, cityId] = await Promise.all([
    resolveReferenceId(supabase, 'categories', optionalString(body.category_id)),
    resolveReferenceId(supabase, 'cities', optionalString(body.city_id)),
  ])

  const expectedProfilePhotoPath = `${user.id}/profile.webp`
  const expectedWorkPhotoPath = `${user.id}/work.webp`
  const hasProfilePhotoPath = Object.prototype.hasOwnProperty.call(body, 'profile_photo_path')
  const hasWorkPhotoPath = Object.prototype.hasOwnProperty.call(body, 'work_photo_path')
  const profilePhotoPath = optionalString(body.profile_photo_path)
  const workPhotoPath = optionalString(body.work_photo_path)

  if (profilePhotoPath && profilePhotoPath !== expectedProfilePhotoPath) {
    return NextResponse.json({ message: 'La foto de perfil no es válida.' }, { status: 400 })
  }
  if (workPhotoPath && workPhotoPath !== expectedWorkPhotoPath) {
    return NextResponse.json({ message: 'La foto de trabajo no es válida.' }, { status: 400 })
  }

  const payload = {
    display_name: displayName,
    category_id: categoryId,
    city_id: cityId,
    zone: optionalString(body.zone),
    description: optionalString(body.description),
    services: services && services.length > 0 ? services.map((service) => service.trim()) : null,
    years_experience: yearsExperience,
    price_reference: optionalString(body.price_reference),
    whatsapp,
    availability: optionalString(body.availability),
    ...(hasProfilePhotoPath ? { profile_photo_path: profilePhotoPath } : {}),
    ...(hasWorkPhotoPath ? { work_photo_path: workPhotoPath } : {}),
  }

  const { data: existing, error: existingError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ message: existingError.message }, { status: 500 })
  }

  if (existing) {
    const { data, error } = await supabase
      .from('provider_profiles')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  }

  const slug = `${slugify(displayName)}-${Math.random().toString(36).slice(2, 6)}`
  const { data, error } = await supabase
    .from('provider_profiles')
    .insert({
      ...payload,
      profile_photo_path: profilePhotoPath,
      work_photo_path: workPhotoPath,
      user_id: user.id,
      slug,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
