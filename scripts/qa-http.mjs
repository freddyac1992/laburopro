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
  '/guardados',
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

const favoritesSource = await readFile(new URL('../src/lib/favorites.ts', import.meta.url), 'utf8')
const favoriteButtonSource = await readFile(new URL('../src/components/ui/FavoriteButton.tsx', import.meta.url), 'utf8')
const favoritesPageSource = await readFile(new URL('../src/app/guardados/page.tsx', import.meta.url), 'utf8')
assert(favoritesSource.includes("laburopro:favorites:v1"), 'Saved providers must use a versioned storage key')
assert(favoritesSource.includes('.slice(0, 50)'), 'Saved providers must have a local storage limit')
assert(favoriteButtonSource.includes('aria-pressed={isFavorite}'), 'Favorite buttons must expose their selected state')
assert(favoritesPageSource.includes('ProviderCard'), 'Saved providers page must reuse provider cards')

const reviewFormSource = await readFile(new URL('../src/components/ui/ReviewForm.tsx', import.meta.url), 'utf8')
const starRatingSource = await readFile(new URL('../src/components/ui/StarRating.tsx', import.meta.url), 'utf8')
assert(!reviewFormSource.includes('<select'), 'Review rating must not use a select control')
assert(reviewFormSource.includes('StarRating'), 'Review form must use the visual star rating control')
assert(starRatingSource.includes('role="radiogroup"'), 'Interactive stars must expose a radio group')
assert(starRatingSource.includes('aria-checked={value === star}'), 'Each star must expose its selected state')

const logoutButtonSource = await readFile(new URL('../src/components/auth/LogoutButton.tsx', import.meta.url), 'utf8')
const providerFiltersSource = await readFile(new URL('../src/components/ui/ProviderFilters.tsx', import.meta.url), 'utf8')
const providerSearchSource = await readFile(new URL('../src/lib/provider-search.ts', import.meta.url), 'utf8')
assert(logoutButtonSource.includes("fetch('/api/auth/logout'"), 'Mobile logout must complete before its menu unmounts')
assert(logoutButtonSource.includes("window.location.assign('/login')"), 'Logout must force a clean login reload')
assert(providerFiltersSource.includes('Solo verificados'), 'Public filters must expose verified providers')
assert(providerFiltersSource.includes('Todos aprobados'), 'Public filters must explain approval status')
assert(providerSearchSource.includes(".eq('is_approved', true)"), 'Public provider results must always be approved')

const brandedSurfacePaths = [
  '../src/app/dashboard/page.tsx',
  '../src/app/dashboard/perfil/page.tsx',
  '../src/app/dashboard/contactos/page.tsx',
  '../src/app/admin/page.tsx',
  '../src/app/admin/contactos/page.tsx',
  '../src/app/proveedores/[slug]/page.tsx',
  '../src/app/servicios/page.tsx',
  '../src/app/servicios/[categoria]/page.tsx',
  '../src/app/servicios/[categoria]/[ciudad]/page.tsx',
  '../src/components/dashboard/DashboardShell.tsx',
  '../src/components/dashboard/LeadPipeline.tsx',
  '../src/components/ui/ReviewForm.tsx',
]
const brandedSurfaceSource = (await Promise.all(
  brandedSurfacePaths.map((path) => readFile(new URL(path, import.meta.url), 'utf8'))
)).join('\n')
assert(!brandedSurfaceSource.includes('blue-'), 'Branded application surfaces must use the teal/coral palette')

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
assert(adminClientSource.includes('SUPABASE_SECRET_KEY'), 'Admin Supabase client must prefer a modern secret key')
assert(adminClientSource.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Admin Supabase client must support the legacy service role key')
assert(!adminClientSource.includes('NEXT_PUBLIC_SUPABASE_SERVICE'), 'Service role key must never be public')
assert(rateLimitSql.includes('TO service_role'), 'Rate limit RPC must only be granted to service_role')
assert(!rateLimitSql.includes('TO anon, authenticated'), 'Rate limit RPC must not be public')
for (const policy of ['leads', 'profile views', 'reviews', 'provider reports']) {
  assert(rateLimitSql.includes(`DROP POLICY IF EXISTS "Anyone can insert ${policy}"`), `Public insert policy must be removed for ${policy}`)
  assert(!schemaSql.includes(`CREATE POLICY "Anyone can insert ${policy}"`), `Base schema must not recreate public insert policy for ${policy}`)
}

const leadPipelineRoute = await readFile(new URL('../src/app/api/leads/[id]/route.ts', import.meta.url), 'utf8')
const leadPipelineSql = await readFile(new URL('../supabase/lead-pipeline.sql', import.meta.url), 'utf8')
for (const status of ['new', 'contacted', 'converted', 'lost']) {
  assert(leadPipelineRoute.includes(`'${status}'`), `Lead pipeline API must allow ${status}`)
  assert(leadPipelineSql.includes(`'${status}'`), `Lead pipeline schema must allow ${status}`)
}
assert(leadPipelineRoute.includes(".eq('provider_id', provider.id)"), 'Lead updates must be scoped to the provider owner')
assert(leadPipelineSql.includes('GRANT UPDATE (status, updated_at)'), 'Authenticated users may only update lead workflow fields')

const leadPipelineUi = await readFile(new URL('../src/components/dashboard/LeadPipeline.tsx', import.meta.url), 'utf8')
const dashboardShellSource = await readFile(new URL('../src/components/dashboard/DashboardShell.tsx', import.meta.url), 'utf8')
const providerDashboardSource = await readFile(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8')
assert(leadPipelineUi.includes('getWaitingLabel'), 'New leads must display their waiting time')
assert(dashboardShellSource.includes('newLeadCount'), 'Provider navigation must show the new lead counter')
assert(providerDashboardSource.includes(".eq('status', 'new').lt('created_at', since(1))"), 'Provider dashboard must detect unattended leads older than 24 hours')

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

await expectStatus('/api/leads/00000000-0000-4000-8000-000000000000', 401, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'contacted' }),
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
