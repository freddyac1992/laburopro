import { readFile } from 'node:fs/promises'

const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000'

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  return response
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function expectStatus(path, status, init) {
  const response = await request(path, init)
  assert(
    response.status === status,
    `${path} expected ${status}, received ${response.status}`
  )
  return response
}

async function expectRedirect(path, target, init, status = 307) {
  const response = await expectStatus(path, status, init)
  const location = response.headers.get('location') ?? ''
  assert(
    location.includes(target),
    `${path} expected redirect to include ${target}, received ${location}`
  )
}

async function expectBody(path, { contains = [], excludes = [] }) {
  const response = await expectStatus(path, 200)
  const body = await response.text()

  for (const text of contains) {
    assert(body.includes(text), `${path} expected body to include ${text}`)
  }
  for (const text of excludes) {
    assert(!body.includes(text), `${path} expected body not to include ${text}`)
  }
}

const publicPages = [
  '/',
  '/servicios',
  '/servicios?q=plomero',
  '/servicios/plomeros',
  '/servicios/plomeros?q=zona',
  '/servicios/plomeros/el-alto',
  '/servicios/plomeros/el-alto?verified=1&sort=experience',
  '/login',
  '/registro',
  '/privacidad',
  '/terminos',
]

for (const path of publicPages) {
  await expectStatus(path, 200)
}

await expectBody('/login', {
  contains: ['login-google-only', 'data-auth-method="google"'],
  excludes: ['login-email', 'login-password'],
})
await expectBody('/registro', {
  contains: ['register-google-only', 'data-auth-method="google"'],
  excludes: ['registro-email', 'registro-password'],
})

const authSources = await Promise.all([
  readFile(new URL('../src/app/login/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/registro/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/auth/GoogleAuthPanel.tsx', import.meta.url), 'utf8'),
])
const authSource = authSources.join('\n')
for (const forbidden of ['signInWithPassword', '.auth.signUp(', 'type="password"']) {
  assert(!authSource.includes(forbidden), `Google-only auth must not include ${forbidden}`)
}
assert(authSource.includes("provider: 'google'"), 'Google OAuth provider must remain configured')

const protectedApiRoutes = [
  ['../src/app/api/leads/route.ts', "'lead'"],
  ['../src/app/api/profile-views/route.ts', "'profile_view'"],
  ['../src/app/api/reviews/route.ts', "'review'"],
  ['../src/app/api/provider-reports/route.ts', "'provider_report'"],
]
for (const [path, action] of protectedApiRoutes) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  assert(source.includes('getRateLimitResponse'), `${path} must enforce rate limiting`)
  assert(source.includes('createAdminClient'), `${path} must use the private Supabase client`)
  assert(source.includes(action), `${path} must use rate limit action ${action}`)
}

const rateLimitSource = await readFile(new URL('../src/lib/rate-limit.ts', import.meta.url), 'utf8')
const adminClientSource = await readFile(new URL('../src/lib/supabase/admin.ts', import.meta.url), 'utf8')
const rateLimitSql = await readFile(new URL('../supabase/rate-limits.sql', import.meta.url), 'utf8')
const schemaSql = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
assert(rateLimitSource.includes('status: 429'), 'Rate limiting must return HTTP 429')
assert(rateLimitSource.includes("'Retry-After'"), 'Rate limiting must include Retry-After')
assert(adminClientSource.includes("import 'server-only'"), 'Admin Supabase client must remain server-only')
assert(adminClientSource.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Admin Supabase client must use the service role key')
assert(!adminClientSource.includes('NEXT_PUBLIC_SUPABASE_SERVICE'), 'Service role key must never be public')
assert(rateLimitSql.includes('TO service_role'), 'Rate limit RPC must only be granted to service_role')
assert(!rateLimitSql.includes('TO anon, authenticated'), 'Rate limit RPC must not be public')
for (const policy of ['leads', 'profile views', 'reviews', 'provider reports']) {
  assert(rateLimitSql.includes(`DROP POLICY IF EXISTS "Anyone can insert ${policy}"`), `Public insert policy must be removed for ${policy}`)
  assert(!schemaSql.includes(`CREATE POLICY "Anyone can insert ${policy}"`), `Base schema must not recreate public insert policy for ${policy}`)
}

await expectRedirect('/dashboard', '/login')
await expectRedirect('/dashboard/perfil', '/login')
await expectRedirect('/dashboard/contactos', '/login')
await expectRedirect('/admin', '/login')
await expectRedirect('/admin/proveedores', '/login')
await expectRedirect('/admin/contactos', '/login')
await expectRedirect('/admin/resenas', '/login')
await expectRedirect('/admin/reportes', '/login')
await expectRedirect('/auth/callback', '/login?error=')
await expectStatus('/api/auth/logout', 405)
await expectRedirect('/api/auth/logout', '/login', { method: 'POST' }, 303)

await expectStatus('/api/provider-profile', 401, {
  method: 'POST',
  body: JSON.stringify({
    display_name: 'QA Provider',
    whatsapp: '59170000000',
  }),
})

await expectStatus('/api/leads', 400, {
  method: 'POST',
  body: JSON.stringify({}),
})

await expectStatus('/api/leads', 404, {
  method: 'POST',
  body: JSON.stringify({
    providerId: '00000000-0000-4000-8000-000000000000',
  }),
})

await expectStatus('/api/profile-views', 400, {
  method: 'POST',
  body: JSON.stringify({}),
})

await expectStatus('/api/profile-views', 404, {
  method: 'POST',
  body: JSON.stringify({
    providerId: '00000000-0000-4000-8000-000000000000',
  }),
})

await expectStatus('/api/reviews', 400, {
  method: 'POST',
  body: JSON.stringify({}),
})

await expectStatus('/api/provider-reports', 400, {
  method: 'POST',
  body: JSON.stringify({}),
})

console.log(`QA HTTP checks passed for ${baseUrl}`)
