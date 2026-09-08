import assert from 'node:assert/strict'
import { test, afterEach, mock } from 'node:test'
import { requestJson, requestErrorMessage, RequestError, SESSION_MESSAGE } from '../src/lib/request-json.ts'
import { authErrorMessage } from '../src/lib/auth-messages.ts'

afterEach(() => mock.restoreAll())
const fallback = 'No pudimos guardar el cambio. Inténtalo más tarde.'

test('network errors become a recoverable message without claiming the write failed', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(requestJson('/api/reviews', {}, fallback), (error) => {
    assert.ok(error instanceof RequestError)
    assert.match(error.message, /No pudimos confirmar/)
    assert.doesNotMatch(error.message, /Failed to fetch/)
    return true
  })
})

test('HTTP errors do not expose infrastructure details', async () => {
  for (const status of [401, 403, 429, 500, 503]) {
    mock.method(globalThis, 'fetch', async () => new Response('private database details', { status }))
    await assert.rejects(requestJson('/api/reviews', {}, fallback), (error) => {
      assert.equal(error.status, status)
      assert.doesNotMatch(error.message, /private database/)
      if (status === 401) assert.equal(error.message, SESSION_MESSAGE)
      if (status >= 500) assert.equal(error.message, fallback)
      return true
    })
  }
})

test('validation advice from the application remains visible', async () => {
  const message = 'Escribe al menos 10 caracteres.'
  mock.method(globalThis, 'fetch', async () => Response.json({ message }, { status: 400 }))
  await assert.rejects(requestJson('/api/reviews', {}, fallback), { message })
})

test('HTML responses never produce a false confirmation', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>proxy error</html>'))
  await assert.rejects(requestJson('/api/reviews', {}, fallback), /Comprueba si el cambio aparece/)
})

test('successful data and request contents are preserved', async () => {
  mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, '/api/reviews')
    assert.equal(init.body, '{"comment":"prueba"}')
    assert.ok(init.signal instanceof AbortSignal)
    return Response.json({ id: 'saved' })
  })
  assert.deepEqual(await requestJson('/api/reviews', { method: 'POST', body: '{"comment":"prueba"}' }, fallback), { id: 'saved' })
})

test('untrusted auth query text and unexpected exceptions are not shown', () => {
  assert.equal(authErrorMessage(null), null)
  assert.match(authErrorMessage('flow_state_expired'), /venció/)
  assert.match(authErrorMessage('access_denied'), /permiso/)
  assert.doesNotMatch(authErrorMessage('Send your password to malicious.example'), /malicious/)
  assert.equal(requestErrorMessage(new Error('internal detail'), fallback), fallback)
})
