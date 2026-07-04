'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SITE_NAME } from '@/lib/constants'

export default function RegistroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.fullName.trim()) return setError('Por favor ingresa tu nombre completo.')
    if (!form.email.trim()) return setError('Por favor ingresa tu correo electrónico.')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden.')

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: 'provider',
          },
        },
      })

      if (authError) throw authError

      if (data.user) {
        // Insert profile
        await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          email: form.email,
          full_name: form.fullName,
          role: 'provider',
        })
        setSuccess(true)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrarse'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Registro exitoso!</h1>
          <p className="text-gray-600 mb-6">
            Revisa tu correo electrónico y confirma tu cuenta para continuar.
            Después podrás crear tu perfil de proveedor.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-blue-700 mb-4">
            <span className="bg-blue-700 text-white px-2 py-1 rounded-lg text-sm font-extrabold">LP</span>
            {SITE_NAME}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Crea tu perfil de proveedor</h1>
          <p className="text-gray-500 text-sm">
            Recibe clientes por WhatsApp. Gratis, sin comisiones.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5"
          id="registro-form"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="registro-nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo
            </label>
            <input
              id="registro-nombre"
              name="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez López"
              className="form-input"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="registro-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              id="registro-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="registro-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="registro-password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              className="form-input"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="registro-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              id="registro-confirm-password"
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              className="form-input"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="registro-submit-btn"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-base"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
          </button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Al registrarte aceptas nuestros{' '}
            <Link href="/terminos" className="underline hover:text-gray-600">Términos de uso</Link>
            {' '}y{' '}
            <Link href="/privacidad" className="underline hover:text-gray-600">Política de privacidad</Link>.
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-700 font-semibold hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  )
}
