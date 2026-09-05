import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import type { FullConfig } from '@playwright/test'

const PRODUCTION_PROJECT_REF = 'gxaqrwrqlwvgrjhmfhti'
const MAX_COOKIE_CHUNK_SIZE = 3180

export const PROVIDER_AUTH_FILE = 'e2e/.auth/provider.json'
export const ADMIN_AUTH_FILE = 'e2e/.auth/admin.json'
export const FIXTURE_FILE = 'e2e/.fixture.json'
export const PROVIDER_NAME = 'QA Proveedor Automatizado'

export type QaFixture = {
  providerUserId: string
  providerEmail: string
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta la variable obligatoria ${name}`)
  return value
}

export function getQaEnvironment() {
  const supabaseUrl = requiredEnv('QA_SUPABASE_URL')
  const anonKey = requiredEnv('QA_SUPABASE_ANON_KEY')
  const serviceRoleKey = requiredEnv('QA_SUPABASE_SERVICE_ROLE_KEY')

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  if (projectRef === PRODUCTION_PROJECT_REF) {
    throw new Error('Las pruebas E2E se negaron a usar el proyecto Supabase de producción.')
  }

  return { supabaseUrl, anonKey, serviceRoleKey, projectRef }
}

export function createQaAdminClient(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getQaEnvironment()
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function approveProviderForQa(providerUserId: string) {
  const adminEmail = requiredEnv('QA_ADMIN_EMAIL')
  const adminPassword = requiredEnv('QA_ADMIN_PASSWORD')
  const session = await signInForQa(adminEmail, adminPassword)
  const { supabaseUrl, anonKey } = getQaEnvironment()
  const adminSessionClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  })

  const { data, error } = await adminSessionClient
    .from('provider_profiles')
    .update({ is_approved: true })
    .eq('user_id', providerUserId)
    .select('id, is_approved')
    .single()

  if (error || !data?.is_approved) {
    throw new Error(error?.message ?? 'El administrador de QA no pudo aprobar el perfil temporal')
  }
  return data.id as string
}

export async function signInForQa(email: string, password: string) {
  const { supabaseUrl, anonKey } = getQaEnvironment()
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(error?.message ?? `No se pudo iniciar sesión con ${email}`)
  return data.session
}

function cookieChunks(name: string, value: string) {
  if (encodeURIComponent(value).length <= MAX_COOKIE_CHUNK_SIZE) {
    return [{ name, value }]
  }

  const chunks: Array<{ name: string; value: string }> = []
  let remaining = value
  while (remaining.length > 0) {
    const valuePart = remaining.slice(0, MAX_COOKIE_CHUNK_SIZE)
    chunks.push({ name: `${name}.${chunks.length}`, value: valuePart })
    remaining = remaining.slice(valuePart.length)
  }
  return chunks
}

export function storageStateForSession(session: Session, config: FullConfig) {
  const { projectRef } = getQaEnvironment()
  const appUrl = new URL(config.projects[0].use.baseURL as string)
  const cookieName = `sb-${projectRef}-auth-token`
  const encodedSession = `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`

  return {
    cookies: cookieChunks(cookieName, encodedSession).map(({ name, value }) => ({
      name,
      value,
      domain: appUrl.hostname,
      path: '/',
      expires: session.expires_at ?? -1,
      httpOnly: false,
      secure: appUrl.protocol === 'https:',
      sameSite: 'Lax' as const,
    })),
    origins: [],
  }
}
