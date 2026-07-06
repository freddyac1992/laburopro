import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/types/database'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error_description') ?? requestUrl.searchParams.get('error')

  // Only allow internal paths to avoid open redirects
  const nextParam = requestUrl.searchParams.get('next') ?? '/dashboard'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

  // Behind a proxy (e.g. Vercel) the original host arrives in x-forwarded-host
  const forwardedHost = request.headers.get('x-forwarded-host')
  const origin =
    process.env.NODE_ENV === 'production' && forwardedHost
      ? `https://${forwardedHost}`
      : requestUrl.origin

  const redirectToLogin = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`)

  if (oauthError) {
    return redirectToLogin(oauthError)
  }

  if (!code) {
    return redirectToLogin('No se pudo autenticar con Google.')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return redirectToLogin(error.message)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirectToLogin('No se pudo autenticar con Google.')
  }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: Role } | null }

  const redirectPath = profile?.role === 'admin' ? '/admin' : next
  return NextResponse.redirect(`${origin}${redirectPath}`)
}
