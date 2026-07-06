import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/types/database'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get user to check role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = (await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()) as { data: { role: Role } | null }

        const redirectPath = profile?.role === 'admin' ? '/admin' : next
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // Redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with Google`)
}
