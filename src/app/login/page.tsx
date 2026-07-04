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
