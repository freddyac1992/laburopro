import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const origin =
    process.env.NODE_ENV === 'production' && forwardedHost
      ? `https://${forwardedHost}`
      : requestUrl.origin

  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(`${origin}/login`)
}
