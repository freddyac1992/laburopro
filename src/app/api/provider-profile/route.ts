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
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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

  const services = Array.isArray(body.services)
    ? body.services.filter((service): service is string => typeof service === 'string' && Boolean(service.trim()))
    : null

  const yearsExperience =
    typeof body.years_experience === 'number' && Number.isFinite(body.years_experience)
      ? body.years_experience
      : null

  const payload = {
    display_name: displayName,
    category_id: optionalString(body.category_id),
    city_id: optionalString(body.city_id),
    zone: optionalString(body.zone),
    description: optionalString(body.description),
    services: services && services.length > 0 ? services.map((service) => service.trim()) : null,
    years_experience: yearsExperience,
    price_reference: optionalString(body.price_reference),
    whatsapp,
    availability: optionalString(body.availability),
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
    .insert({ ...payload, user_id: user.id, slug })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
