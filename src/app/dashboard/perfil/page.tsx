'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CITIES } from '@/lib/constants'
import {
  compressProviderImage,
  getProviderImageUrl,
  PROVIDER_IMAGES_BUCKET,
} from '@/lib/provider-images'
import type { ProviderProfile } from '@/types/database'

type PhotoKind = 'profile' | 'work'

const photoConfig = {
  profile: { filename: 'profile.webp', width: 800, height: 800 },
  work: { filename: 'work.webp', width: 1600, height: 1200 },
} as const

const WIZARD_STEPS = [
  { number: 1, label: 'Sobre ti' },
  { number: 2, label: 'Tu trabajo' },
  { number: 3, label: 'Tu WhatsApp' },
  { number: 4, label: 'Tus fotos' },
] as const

function localWhatsAppNumber(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, '') ?? ''
  return digits.startsWith('591') && digits.length === 11 ? digits.slice(3) : digits
}

function fullWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 8 ? `591${digits}` : digits
}

interface FormState {
  display_name: string
  category_id: string
  city_id: string
  zone: string
  description: string
  services: string
  years_experience: string
  price_reference: string
  whatsapp: string
  availability: string
}

export default function PerfilPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [photoPaths, setPhotoPaths] = useState<Record<PhotoKind, string | null>>({ profile: null, work: null })
  const [photoFiles, setPhotoFiles] = useState<Record<PhotoKind, File | null>>({ profile: null, work: null })
  const [photoPreviews, setPhotoPreviews] = useState<Record<PhotoKind, string | null>>({ profile: null, work: null })
  const [removedPhotos, setRemovedPhotos] = useState<Record<PhotoKind, boolean>>({ profile: false, work: false })
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [dbCities, setDbCities] = useState<{ id: string; name: string; slug: string }[]>([])

  const [form, setForm] = useState<FormState>({
    display_name: '',
    category_id: '',
    city_id: '',
    zone: '',
    description: '',
    services: '',
    years_experience: '',
    price_reference: '',
    whatsapp: '',
    availability: '',
  })

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setError('No se pudo cargar tu sesión. Actualiza la página o vuelve a iniciar sesión.')
        setLoading(false)
        return
      }
      setUserId(user.id)
      if (cancelled) return

      // Load categories and cities from DB (fallback to constants)
      const [catsResult, citiesResult] = await Promise.all([
        supabase.from('categories').select('id, name, slug').order('name'),
        supabase.from('cities').select('id, name, slug').order('name'),
      ])
      if (cancelled) return

      const cats = catsResult.data ?? []
      const cities = citiesResult.data ?? []
      setDbCategories(cats)
      setDbCities(cities)

      // Load existing provider profile
      const { data: existing } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return
      const providerProfile = existing as ProviderProfile | null
      if (providerProfile) {
        setProfileId(providerProfile.id)
        setPhotoPaths({
          profile: providerProfile.profile_photo_path,
          work: providerProfile.work_photo_path,
        })
        setPhotoPreviews({
          profile: getProviderImageUrl(providerProfile.profile_photo_path, providerProfile.updated_at),
          work: getProviderImageUrl(providerProfile.work_photo_path, providerProfile.updated_at),
        })
        setForm({
          display_name: providerProfile.display_name ?? '',
          category_id: providerProfile.category_id ?? '',
          city_id: providerProfile.city_id ?? '',
          zone: providerProfile.zone ?? '',
          description: providerProfile.description ?? '',
          services: providerProfile.services ? providerProfile.services.join(', ') : '',
          years_experience: providerProfile.years_experience?.toString() ?? '',
          price_reference: providerProfile.price_reference ?? '',
          whatsapp: localWhatsAppNumber(providerProfile.whatsapp),
          availability: providerProfile.availability ?? '',
        })
      } else {
        try {
          const draft = window.localStorage.getItem(`laburopro:profile-draft:v1:${user.id}`)
          if (draft) setForm((current) => ({ ...current, ...JSON.parse(draft) as Partial<FormState> }))
        } catch {
          // A damaged local draft should not block profile creation.
        }
      }

      setLoading(false)
    }

    void loadData()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (loading || !userId || profileId) return
    window.localStorage.setItem(`laburopro:profile-draft:v1:${userId}`, JSON.stringify(form))
  }, [form, loading, profileId, userId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  function handlePhotoChange(kind: PhotoKind, file: File | undefined) {
    if (!file) return

    const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!acceptedTypes.has(file.type)) {
      setError('Las fotos deben ser JPG, PNG o WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen original no puede superar 10 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPhotoFiles((current) => ({ ...current, [kind]: file }))
      setPhotoPreviews((current) => ({ ...current, [kind]: String(reader.result) }))
      setRemovedPhotos((current) => ({ ...current, [kind]: false }))
      setError(null)
      setSuccess(false)
    }
    reader.readAsDataURL(file)
  }

  function removePhoto(kind: PhotoKind) {
    setPhotoFiles((current) => ({ ...current, [kind]: null }))
    setPhotoPaths((current) => ({ ...current, [kind]: null }))
    setPhotoPreviews((current) => ({ ...current, [kind]: null }))
    setRemovedPhotos((current) => ({ ...current, [kind]: true }))
    setSuccess(false)
  }

  function validateStep(step: number) {
    if (step === 1) {
      if (!form.display_name.trim()) return 'Escribe tu nombre o el nombre de tu negocio.'
      if (!form.category_id) return 'Elige el trabajo que realizas.'
      if (!form.city_id) return 'Elige la ciudad donde trabajas.'
    }
    if (step === 3 && !form.whatsapp.trim()) {
      return 'Escribe el número donde quieres recibir mensajes por WhatsApp.'
    }
    if (step === 3 && localWhatsAppNumber(form.whatsapp).length !== 8) {
      return 'Tu número de WhatsApp debe tener 8 números. Ejemplo: 71234567.'
    }
    return null
  }

  function goToNextStep() {
    const validationError = validateStep(currentStep)
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError(null)
    setCurrentStep((step) => Math.min(4, step + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToPreviousStep() {
    setError(null)
    setCurrentStep((step) => Math.max(1, step - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const requiredError = validateStep(1) ?? validateStep(3)
    if (requiredError) return setError(requiredError)

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')
      const userId = user.id

      async function syncPhoto(kind: PhotoKind) {
        const config = photoConfig[kind]
        const path = `${userId}/${config.filename}`
        const file = photoFiles[kind]

        if (file) {
          const compressed = await compressProviderImage(file, config)
          const { error: uploadError } = await supabase.storage
            .from(PROVIDER_IMAGES_BUCKET)
            .upload(path, compressed, {
              contentType: 'image/webp',
              cacheControl: '3600',
              upsert: true,
            })

          if (uploadError) throw new Error(`No se pudo subir la foto: ${uploadError.message}`)
          return path
        }

        if (removedPhotos[kind]) {
          const { error: removeError } = await supabase.storage
            .from(PROVIDER_IMAGES_BUCKET)
            .remove([path])
          if (removeError) throw new Error(`No se pudo eliminar la foto: ${removeError.message}`)
          return null
        }

        return photoPaths[kind]
      }

      const [profilePhotoPath, workPhotoPath] = await Promise.all([
        syncPhoto('profile'),
        syncPhoto('work'),
      ])

      const servicesArray = form.services
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        display_name: form.display_name.trim(),
        category_id: form.category_id || null,
        city_id: form.city_id || null,
        zone: form.zone.trim() || null,
        description: form.description.trim() || null,
        services: servicesArray.length > 0 ? servicesArray : null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        price_reference: form.price_reference.trim() || null,
        whatsapp: fullWhatsAppNumber(form.whatsapp),
        availability: form.availability.trim() || null,
        profile_photo_path: profilePhotoPath,
        work_photo_path: workPhotoPath,
      }

      const response = await fetch('/api/provider-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { id?: string; message?: string }

      if (!response.ok) {
        throw new Error(result.message ?? 'Error al guardar')
      }

      if (result.id) setProfileId(result.id)
      if (userId) window.localStorage.removeItem(`laburopro:profile-draft:v1:${userId}`)
      const imageVersion = String(Date.now())
      setPhotoPaths({ profile: profilePhotoPath, work: workPhotoPath })
      setPhotoFiles({ profile: null, work: null })
      setRemovedPhotos({ profile: false, work: false })
      setPhotoPreviews({
        profile: getProviderImageUrl(profilePhotoPath, imageVersion),
        work: getProviderImageUrl(workPhotoPath, imageVersion),
      })
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos guardar tu perfil.'
      setError(`${msg} Revisa tu conexión e inténtalo nuevamente.`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardShell title="Mi perfil">
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-400 text-lg">Cargando…</div>
        </div>
      </DashboardShell>
    )
  }

  // Use DB data if available, fallback to constants
  const categoryOptions = dbCategories.length > 0
    ? dbCategories
    : CATEGORIES.map((c) => ({ id: c.slug, name: c.name, slug: c.slug }))
  const cityOptions = dbCities.length > 0
    ? dbCities
    : CITIES.map((c) => ({ id: c.slug, name: c.name, slug: c.slug }))

  return (
    <DashboardShell title={profileId ? 'Actualizar mi información' : 'Crear mi perfil de trabajo'}>
      <form onSubmit={handleSubmit} className="space-y-5" id="perfil-form">
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-bold text-gray-900">Paso {currentStep} de 4: {WIZARD_STEPS[currentStep - 1].label}</p>
            {!profileId && <span className="text-xs text-gray-500">Tu avance se guarda en este teléfono</span>}
          </div>
          <div className="grid grid-cols-4 gap-2" aria-label={`Paso ${currentStep} de 4`}>
            {WIZARD_STEPS.map((step) => (
              <div key={step.number} className="min-w-0">
                <div className={`h-2 rounded-full ${step.number <= currentStep ? 'bg-teal-700' : 'bg-gray-200'}`} />
                <span className={`hidden sm:block mt-2 text-xs ${step.number === currentStep ? 'font-bold text-teal-800' : 'text-gray-500'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {success && (
          <div role="status" className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 font-semibold">
            Tu perfil fue guardado correctamente. Nuestro equipo lo revisará antes de mostrarlo al público.
          </div>
        )}
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 font-semibold">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <section className="wizard-panel" aria-labelledby="step-one-title">
            <div>
              <h2 id="step-one-title" className="wizard-title">Cuéntanos quién eres</h2>
              <p className="wizard-help">Estos datos ayudan a que las personas te encuentren.</p>
            </div>
            <label className="wizard-label" htmlFor="perfil-nombre">
              Tu nombre o el nombre de tu negocio
              <input id="perfil-nombre" name="display_name" type="text" value={form.display_name} onChange={handleChange} placeholder="Ejemplo: Juan Pérez o Plomería Don Juan" className="form-input mt-2" autoComplete="name" />
            </label>
            <label className="wizard-label" htmlFor="perfil-categoria">
              ¿Qué trabajo realizas?
              <select id="perfil-categoria" name="category_id" value={form.category_id} onChange={handleChange} className="form-input mt-2">
                <option value="">Toca aquí para elegir</option>
                {categoryOptions.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </label>
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="wizard-label" htmlFor="perfil-ciudad">
                ¿En qué ciudad trabajas?
                <select id="perfil-ciudad" name="city_id" value={form.city_id} onChange={handleChange} className="form-input mt-2">
                  <option value="">Toca aquí para elegir</option>
                  {cityOptions.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </label>
              <label className="wizard-label" htmlFor="perfil-zona">
                Tu zona o barrio <span className="wizard-optional">(opcional)</span>
                <input id="perfil-zona" name="zone" type="text" value={form.zone} onChange={handleChange} placeholder="Ejemplo: Villa Fátima" className="form-input mt-2" />
              </label>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="wizard-panel" aria-labelledby="step-two-title">
            <div>
              <h2 id="step-two-title" className="wizard-title">Explica qué trabajos haces</h2>
              <p className="wizard-help">Usa palabras sencillas. Puedes dejar los datos que no sepas para después.</p>
            </div>
            <label className="wizard-label" htmlFor="perfil-descripcion">
              Cuéntale a un cliente cómo puedes ayudarle
              <textarea id="perfil-descripcion" name="description" rows={5} value={form.description} onChange={handleChange} placeholder="Ejemplo: Hago instalaciones y reparaciones eléctricas en casas y negocios. Trabajo en La Paz y El Alto." className="form-input mt-2 resize-none" />
            </label>
            <label className="wizard-label" htmlFor="perfil-servicios">
              Escribe algunos trabajos que realizas <span className="wizard-optional">(opcional)</span>
              <input id="perfil-servicios" name="services" type="text" value={form.services} onChange={handleChange} placeholder="Ejemplo: enchufes, duchas, cableado" className="form-input mt-2" />
              <span className="wizard-help block mt-2">Separa cada trabajo con una coma.</span>
            </label>
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="wizard-label" htmlFor="perfil-experiencia">
                Años trabajando <span className="wizard-optional">(opcional)</span>
                <input id="perfil-experiencia" name="years_experience" type="number" inputMode="numeric" min="0" max="50" value={form.years_experience} onChange={handleChange} placeholder="Ejemplo: 5" className="form-input mt-2" />
              </label>
              <label className="wizard-label" htmlFor="perfil-precio">
                Precio aproximado <span className="wizard-optional">(opcional)</span>
                <input id="perfil-precio" name="price_reference" type="text" value={form.price_reference} onChange={handleChange} placeholder="Ejemplo: Desde Bs 80" className="form-input mt-2" />
              </label>
            </div>
            <label className="wizard-label" htmlFor="perfil-disponibilidad">
              ¿Cuándo puedes atender? <span className="wizard-optional">(opcional)</span>
              <input id="perfil-disponibilidad" name="availability" type="text" value={form.availability} onChange={handleChange} placeholder="Ejemplo: De lunes a sábado" className="form-input mt-2" />
            </label>
          </section>
        )}

        {currentStep === 3 && (
          <section className="wizard-panel" aria-labelledby="step-three-title">
            <div>
              <h2 id="step-three-title" className="wizard-title">¿Dónde deben escribirte?</h2>
              <p className="wizard-help">Los clientes usarán este número para hablar contigo por WhatsApp.</p>
            </div>
            <label className="wizard-label" htmlFor="perfil-whatsapp">
              Tu número de WhatsApp
              <div className="flex items-center gap-2 mt-2">
                <span className="min-h-12 inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 font-bold text-gray-700">+591</span>
              <input id="perfil-whatsapp" name="whatsapp" type="tel" inputMode="numeric" autoComplete="tel" maxLength={8} value={form.whatsapp} onChange={handleChange} placeholder="Ejemplo: 71234567" className="form-input flex-1" />
              </div>
            </label>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm leading-relaxed text-teal-900">
              Escribe solamente los 8 números de tu celular. Nosotros agregaremos el código de Bolivia. No mostraremos tu contraseña ni datos de Google.
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="wizard-panel" aria-labelledby="step-four-title">
            <div>
              <h2 id="step-four-title" className="wizard-title">Muestra quién eres y cómo trabajas</h2>
              <p className="wizard-help">Las fotos son opcionales, pero ayudan a que las personas confíen en tu trabajo.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {(['profile', 'work'] as PhotoKind[]).map((kind) => {
                const isProfile = kind === 'profile'
                const inputId = isProfile ? 'perfil-foto' : 'trabajo-foto'
                return (
                  <div key={kind} className="rounded-lg border border-gray-200 p-4">
                    <label htmlFor={inputId} className="wizard-label">{isProfile ? 'Una foto tuya' : 'Una foto de un trabajo'}</label>
                    <div className={`relative mt-3 mb-3 overflow-hidden rounded-lg bg-gray-100 border border-gray-200 ${isProfile ? 'w-40 aspect-square' : 'w-full aspect-[4/3]'}`}>
                      {photoPreviews[kind] ? (
                        <Image src={photoPreviews[kind]!} alt={isProfile ? 'Tu foto seleccionada' : 'Foto del trabajo seleccionada'} fill sizes={isProfile ? '160px' : '(max-width: 768px) 100vw, 384px'} className="object-cover" unoptimized />
                      ) : <div className="h-full flex items-center justify-center px-4 text-center text-sm text-gray-500">Todavía no elegiste una foto</div>}
                    </div>
                    <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handlePhotoChange(kind, event.target.files?.[0])} className="easy-file-input block w-full text-sm text-gray-700" />
                    {photoPreviews[kind] && <button type="button" onClick={() => removePhoto(kind)} className="mt-3 min-h-11 text-sm font-bold text-red-700">Quitar esta foto</button>}
                  </div>
                )
              })}
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-bold mb-1">Antes de guardar</p>
              <p>{form.display_name || 'Tu nombre'} · {categoryOptions.find((item) => item.id === form.category_id)?.name || 'sin oficio'} · {cityOptions.find((item) => item.id === form.city_id)?.name || 'sin ciudad'}</p>
              <p className="mt-1">WhatsApp: {form.whatsapp || 'sin número'}</p>
            </div>
          </section>
        )}

        <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 border-t border-gray-200 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(16,42,51,0.08)] backdrop-blur">
          <div className="flex gap-3 max-w-3xl mx-auto">
            {currentStep > 1 && <button type="button" onClick={goToPreviousStep} className="min-h-12 px-5 rounded-md border border-gray-300 bg-white font-bold text-gray-800">Volver</button>}
            {currentStep < 4 ? (
              <button type="button" onClick={goToNextStep} className="min-h-12 flex-1 rounded-md bg-teal-700 px-5 font-extrabold text-white hover:bg-teal-800">Continuar</button>
            ) : (
              <button type="submit" disabled={saving} id="perfil-submit-btn" className="min-h-12 flex-1 rounded-md bg-[#e85d3f] px-5 font-extrabold text-white hover:bg-[#cf4f34] disabled:opacity-60">
                {saving ? 'Guardando, espera un momento...' : profileId ? 'Guardar mis cambios' : 'Enviar mi perfil para revisión'}
              </button>
            )}
          </div>
        </div>
      </form>
    </DashboardShell>
  )
}
