import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

export function createRouteClient(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = []
  const headersToSet: Record<string, string> = {}

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(newCookies, headers) {
          cookiesToSet.push(...newCookies)
          Object.assign(headersToSet, headers)
        },
      },
    }
  )

  function applyAuthCookies(response: NextResponse) {
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    Object.entries(headersToSet).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  return { supabase, applyAuthCookies }
}
