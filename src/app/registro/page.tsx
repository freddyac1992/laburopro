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

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // No apagamos `loading`: el navegador está por redirigir a Google.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null
      setError(msg || 'Error al registrarse con Google')
      setLoading(false)
    }
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

      if (data.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      // The profiles row is created by the on_auth_user_created DB trigger.
      // When email confirmation is enabled, Supabase returns a user without a session.
      if (data.user) setSuccess(true)
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

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">O</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-base"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.8 1.182 15.073 0 12 0 7.336 0 3.327 2.682 1.386 6.614l3.88 3.151z"
              />
              <path
                fill="#34A853"
                d="M16.04 15.345c-1.073.71-2.437 1.137-4.04 1.137-2.855 0-5.273-1.927-6.136-4.518L1.964 15.12C3.927 19.01 7.945 21.682 12 21.682c3.155 0 6.01-.1 7.945-2.182l-3.905-4.155z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.273c0-.818-.082-1.609-.227-2.364H12v4.518h6.464c-.29 1.482-1.127 2.736-2.382 3.582l3.905 4.155c2.282-2.1 3.504-5.182 3.504-8.891z"
              />
              <path
                fill="#FBBC05"
                d="M5.864 11.964c0-.709.118-1.4.345-2.055L2.33 6.759A11.91 11.91 0 0 0 1 12c0 1.9.445 3.7 1.236 5.318l3.964-3.173a7.03 7.03 0 0 1-.336-2.181z"
              />
            </svg>
            Registrarse con Google
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
