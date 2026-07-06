'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CITIES } from '@/lib/constants'
import { slugify } from '@/lib/utils'
import type { ProviderProfile } from '@/types/database'

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
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      if (cancelled) return
      setUserId(user.id)

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
        setForm({
          display_name: providerProfile.display_name ?? '',
          category_id: providerProfile.category_id ?? '',
          city_id: providerProfile.city_id ?? '',
          zone: providerProfile.zone ?? '',
          description: providerProfile.description ?? '',
          services: providerProfile.services ? providerProfile.services.join(', ') : '',
          years_experience: providerProfile.years_experience?.toString() ?? '',
          price_reference: providerProfile.price_reference ?? '',
          whatsapp: providerProfile.whatsapp ?? '',
          availability: providerProfile.availability ?? '',
        })
      }

      setLoading(false)
    }

    void loadData()
    return () => {
      cancelled = true
    }
  }, [router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!form.display_name.trim()) return setError('El nombre es obligatorio.')
    if (!form.whatsapp.trim()) return setError('El número de WhatsApp es obligatorio.')
    if (!userId) return setError('No se pudo identificar al usuario. Vuelve a iniciar sesión.')

    setSaving(true)
    try {
      const supabase = createClient()
      const slug = slugify(form.display_name) + '-' + Math.random().toString(36).slice(2, 6)
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
        whatsapp: form.whatsapp.trim(),
        availability: form.availability.trim() || null,
      }

      if (profileId) {
        const { error: updateError } = await supabase
          .from('provider_profiles')
          .update(payload)
          .eq('id', profileId)
        if (updateError) throw updateError
      } else {
        const { data: newProfile, error: insertError } = await supabase
          .from('provider_profiles')
          .insert({ ...payload, user_id: userId, slug })
          .select('id')
          .single()
        if (insertError) throw insertError
        if (newProfile) setProfileId(newProfile.id)
      }

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setError(msg)
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
    <DashboardShell title={profileId ? 'Editar perfil' : 'Crear perfil'}>
      <form onSubmit={handleSubmit} className="space-y-6" id="perfil-form">
        {/* Success/Error messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm font-medium">
            ✅ Perfil guardado correctamente. {!profileId && 'Nuestro equipo lo revisará pronto.'}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 border-b border-gray-50 pb-3">Información básica</h2>

          <div>
            <label htmlFor="perfil-nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre / Nombre de negocio *
            </label>
            <input
              id="perfil-nombre"
              name="display_name"
              type="text"
              required
              value={form.display_name}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez — Plomería"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="perfil-categoria" className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoría principal
              </label>
              <select
                id="perfil-categoria"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Seleccionar categoría</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="perfil-ciudad" className="block text-sm font-medium text-gray-700 mb-1.5">
                Ciudad
              </label>
              <select
                id="perfil-ciudad"
                name="city_id"
                value={form.city_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Seleccionar ciudad</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="perfil-zona" className="block text-sm font-medium text-gray-700 mb-1.5">
              Zona / Barrio
            </label>
            <input
              id="perfil-zona"
              name="zone"
              type="text"
              value={form.zone}
              onChange={handleChange}
              placeholder="Ej. Plan 3000, Equipetrol, Villa Fátima…"
              className="form-input"
            />
          </div>
        </div>

        {/* Service details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 border-b border-gray-50 pb-3">Detalles del servicio</h2>

          <div>
            <label htmlFor="perfil-descripcion" className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              id="perfil-descripcion"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe tu servicio, tu experiencia, y por qué deberían contratarte…"
              className="form-input resize-none"
            />
          </div>

          <div>
            <label htmlFor="perfil-servicios" className="block text-sm font-medium text-gray-700 mb-1.5">
              Servicios específicos
              <span className="text-gray-400 font-normal ml-1">(separados por comas)</span>
            </label>
            <input
              id="perfil-servicios"
              name="services"
              type="text"
              value={form.services}
              onChange={handleChange}
              placeholder="Ej. Instalación de tuberías, Reparación de filtraciones, Duchas…"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="perfil-experiencia" className="block text-sm font-medium text-gray-700 mb-1.5">
                Años de experiencia
              </label>
              <input
                id="perfil-experiencia"
                name="years_experience"
                type="number"
                min="0"
                max="50"
                value={form.years_experience}
                onChange={handleChange}
                placeholder="Ej. 5"
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="perfil-precio" className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio de referencia
              </label>
              <input
                id="perfil-precio"
                name="price_reference"
                type="text"
                value={form.price_reference}
                onChange={handleChange}
                placeholder="Ej. Desde Bs 80 la hora"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="perfil-disponibilidad" className="block text-sm font-medium text-gray-700 mb-1.5">
              Disponibilidad
            </label>
            <input
              id="perfil-disponibilidad"
              name="availability"
              type="text"
              value={form.availability}
              onChange={handleChange}
              placeholder="Ej. Lunes a sábado, 8am–6pm"
              className="form-input"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 border-b border-gray-50 pb-3">Contacto</h2>
          <div>
            <label htmlFor="perfil-whatsapp" className="block text-sm font-medium text-gray-700 mb-1.5">
              Número de WhatsApp *
            </label>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-500 font-medium w-10 text-center">+591</span>
              <input
                id="perfil-whatsapp"
                name="whatsapp"
                type="tel"
                required
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="Ej. 59178901234"
                className="form-input flex-1"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Incluye el código de país. Ej: 59178901234
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          id="perfil-submit-btn"
          className="w-full py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-base"
        >
          {saving ? 'Guardando…' : profileId ? 'Guardar cambios' : 'Publicar mi perfil'}
        </button>
      </form>
    </DashboardShell>
  )
}
