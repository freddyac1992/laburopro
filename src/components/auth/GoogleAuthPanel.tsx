'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'register'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.8 1.182 15.073 0 12 0 7.336 0 3.327 2.682 1.386 6.614l3.88 3.151z" />
      <path fill="#34A853" d="M16.04 15.345c-1.073.71-2.437 1.137-4.04 1.137-2.855 0-5.273-1.927-6.136-4.518L1.964 15.12C3.927 19.01 7.945 21.682 12 21.682c3.155 0 6.01-.1 7.945-2.182l-3.905-4.155z" />
      <path fill="#4285F4" d="M23.49 12.273c0-.818-.082-1.609-.227-2.364H12v4.518h6.464c-.29 1.482-1.127 2.736-2.382 3.582l3.905 4.155c2.282-2.1 3.504-5.182 3.504-8.891z" />
      <path fill="#FBBC05" d="M5.864 11.964c0-.709.118-1.4.345-2.055L2.33 6.759A11.91 11.91 0 0 0 1 12c0 1.9.445 3.7 1.236 5.318l3.964-3.173a7.03 7.03 0 0 1-.336-2.181z" />
    </svg>
  )
}

export default function GoogleAuthPanel({ mode }: { mode: AuthMode }) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const isRegister = mode === 'register'

  useEffect(() => {
    if (searchParams.get('error')) {
      window.history.replaceState(null, '', isRegister ? '/registro' : '/login')
    }
  }, [isRegister, searchParams])

  async function continueWithGoogle() {
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) throw oauthError
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : null
      setError(message || 'No se pudo continuar con Google.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[72vh] bg-[#f1f6f4] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 w-11 h-11 rounded-md bg-teal-700 text-white flex items-center justify-center text-sm font-extrabold shadow-sm">
            LP
          </div>
          <h1 className="text-3xl font-extrabold text-[#102a33] mb-2">
            {isRegister ? 'Publica tu servicio' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            {isRegister
              ? 'Crea tu cuenta de proveedor y comienza a recibir contactos.'
              : 'Accede a tu panel de LaburoPro con tu cuenta de Google.'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-[0_18px_50px_rgba(16,42,51,0.08)] p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 text-sm mb-5" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={loading}
            id={isRegister ? 'register-google-btn' : 'login-google-btn'}
            className="w-full min-h-12 flex items-center justify-center gap-3 border border-slate-300 hover:border-teal-600 hover:bg-teal-50 disabled:opacity-60 text-[#102a33] font-bold rounded-md"
          >
            <GoogleIcon />
            {loading ? 'Conectando con Google...' : 'Continuar con Google'}
          </button>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-extrabold flex-shrink-0">✓</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Google confirma tu identidad y LaburoPro nunca recibe ni almacena tu contraseña.
            </p>
          </div>

          {isRegister && (
            <p className="text-xs text-slate-400 text-center leading-relaxed mt-5">
              Al continuar aceptas nuestros{' '}
              <Link href="/terminos" className="underline hover:text-slate-600">Términos de uso</Link>
              {' '}y la{' '}
              <Link href="/privacidad" className="underline hover:text-slate-600">Política de privacidad</Link>.
            </p>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          {isRegister ? '¿Ya tienes una cuenta?' : '¿Quieres publicar un servicio?'}{' '}
          <Link
            href={isRegister ? '/login' : '/registro'}
            className="text-teal-700 font-bold hover:underline"
          >
            {isRegister ? 'Ingresar' : 'Crear perfil'}
          </Link>
        </p>
      </div>
    </div>
  )
}
