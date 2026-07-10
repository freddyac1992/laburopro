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

await expectStatus('/api/reviews', 400, {
  method: 'POST',
  body: JSON.stringify({}),
})

await expectStatus('/api/provider-reports', 400, {
  method: 'POST',
  body: JSON.stringify({}),
})

console.log(`QA HTTP checks passed for ${baseUrl}`)
