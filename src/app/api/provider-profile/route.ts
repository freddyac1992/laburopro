import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

type ServerClient = Awaited<ReturnType<typeof createClient>>
type ProviderProfilePayload = {
  display_name: string
  category_id: string | null
  city_id: string | null
  zone: string | null
  description: string | null
  services: string[] | null
  years_experience: number | null
  price_reference: string | null
  whatsapp: string
  availability: string | null
  profile_photo_path?: string | null
  work_photo_path?: string | null
}

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
  supabase: ServerClient,
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

async function ensureOwnerProfile(supabase: ServerClient, user: User) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (error || profile) return error?.message ?? null

  const fullName = typeof user.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : null
  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? null,
    full_name: fullName,
    role: 'provider',
  })

  return insertError?.message ?? null
}

function getPhotoInput(body: ProviderProfileRequestBody, userId: string) {
  const profilePhotoPath = optionalString(body.profile_photo_path)
  const workPhotoPath = optionalString(body.work_photo_path)
  const invalidProfilePhoto = profilePhotoPath && profilePhotoPath !== `${userId}/profile.webp`
  const invalidWorkPhoto = workPhotoPath && workPhotoPath !== `${userId}/work.webp`
  let error: string | null = null
  if (invalidProfilePhoto) error = 'La foto de perfil no es válida.'
  if (invalidWorkPhoto) error = 'La foto de trabajo no es válida.'

  return {
    profilePhotoPath,
    workPhotoPath,
    hasProfilePhotoPath: Object.hasOwn(body, 'profile_photo_path'),
    hasWorkPhotoPath: Object.hasOwn(body, 'work_photo_path'),
    error,
  }
}

async function saveProviderProfile(
  supabase: ServerClient,
  userId: string,
  displayName: string,
  payload: ProviderProfilePayload,
) {
  const { data: existing, error: existingError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', userId)
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

    return error
      ? NextResponse.json({ message: error.message }, { status: 500 })
      : NextResponse.json({ id: data.id })
  }

  const slug = `${slugify(displayName)}-${crypto.randomUUID().slice(0, 8)}`
  const { data, error } = await supabase
    .from('provider_profiles')
    .insert({
      ...payload,
      profile_photo_path: payload.profile_photo_path ?? null,
      work_photo_path: payload.work_photo_path ?? null,
      user_id: userId,
      slug,
      display_name: displayName,
    })
    .select('id')
    .single()

  return error
    ? NextResponse.json({ message: error.message }, { status: 500 })
    : NextResponse.json({ id: data.id })
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

  const ownerProfileError = await ensureOwnerProfile(supabase, user)
  if (ownerProfileError) {
    return NextResponse.json({ message: ownerProfileError }, { status: 500 })
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

  const photoInput = getPhotoInput(body, user.id)
  if (photoInput.error) {
    return NextResponse.json({ message: photoInput.error }, { status: 400 })
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
    ...(photoInput.hasProfilePhotoPath ? { profile_photo_path: photoInput.profilePhotoPath } : {}),
    ...(photoInput.hasWorkPhotoPath ? { work_photo_path: photoInput.workPhotoPath } : {}),
  }

  return saveProviderProfile(supabase, user.id, displayName, payload)
}
