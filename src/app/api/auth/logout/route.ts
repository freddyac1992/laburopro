import { NextResponse, type NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

export function GET() {
  return NextResponse.json(
    { message: 'Usa POST para cerrar sesión.' },
    { status: 405, headers: { Allow: 'POST' } }
  )
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const origin =
    process.env.NODE_ENV === 'production' && forwardedHost
      ? `${forwardedProto ?? requestUrl.protocol.replace(':', '')}://${forwardedHost}`
      : requestUrl.origin

  const { supabase, applyAuthCookies } = createRouteClient(request)
  await supabase.auth.signOut()

  return applyAuthCookies(NextResponse.redirect(`${origin}/login`))
}
