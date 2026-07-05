'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SITE_NAME } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '' })

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
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google')
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.email) return setError('Ingresa tu correo.')
    if (!form.password) return setError('Ingresa tu contraseña.')

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) throw authError

      // Check role for redirect
      if (data.user) {
        const { data: profile } = (await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()) as any

        if (profile?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
      // Translate common errors
      if (msg.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirma tu correo electrónico primero.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm">Accede a tu panel de proveedor</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5"
          id="login-form"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Tu contraseña"
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-base"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
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
            Continuar con Google
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-blue-700 font-semibold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
