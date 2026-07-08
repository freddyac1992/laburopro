import { NextResponse, type NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'
import type { Role } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error_description') ?? requestUrl.searchParams.get('error')

  // Only allow internal paths to avoid open redirects
  const nextParam = requestUrl.searchParams.get('next') ?? '/dashboard'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

  // Behind a proxy (e.g. Vercel) the original host arrives in x-forwarded-host
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const origin =
    process.env.NODE_ENV === 'production' && forwardedHost
      ? `${forwardedProto ?? requestUrl.protocol.replace(':', '')}://${forwardedHost}`
      : requestUrl.origin

  const redirectToLogin = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`)

  if (oauthError) {
    return redirectToLogin(oauthError)
  }

  if (!code) {
    return redirectToLogin('No se pudo autenticar con Google.')
  }

  const { supabase, applyAuthCookies } = createRouteClient(request)
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return applyAuthCookies(redirectToLogin(error.message))
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return applyAuthCookies(redirectToLogin('No se pudo autenticar con Google.'))
  }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()) as { data: { role: Role } | null }

  const redirectPath = profile?.role === 'admin' ? '/admin' : next
  return applyAuthCookies(NextResponse.redirect(`${origin}${redirectPath}`))
}
