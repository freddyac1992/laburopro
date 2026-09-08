export const SESSION_MESSAGE = 'Necesitas volver a entrar a tu cuenta. Usa el mismo correo de Google con el que te registraste.'

export class RequestError extends Error {
  readonly status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'RequestError'
    this.status = status
  }
}

export function requestErrorMessage(error: unknown, fallback: string) {
  return error instanceof RequestError ? error.message : fallback
}

// Only application validation messages are shown; infrastructure failures may
// contain HTML, database details, or English messages from an upstream service.
export async function requestJson<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(30_000) })
  } catch {
    throw new RequestError('No pudimos confirmar el envío. Revisa tu conexión a internet antes de volver a intentarlo.')
  }

  if (response.status === 401) throw new RequestError(SESSION_MESSAGE, 401)
  if (response.status === 403) throw new RequestError('Esta cuenta no tiene permiso para hacer ese cambio. Comprueba con qué correo entraste.', 403)
  if (response.status === 429) throw new RequestError('Has enviado varios intentos seguidos. Espera unos minutos antes de intentarlo otra vez.', 429)
  if (response.status >= 500) throw new RequestError(fallback, response.status)

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new RequestError('No pudimos confirmar el resultado. Comprueba si el cambio aparece antes de enviarlo otra vez.', response.status)
  }
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body ? body.message : null
    throw new RequestError(typeof message === 'string' && message.trim() ? message : fallback, response.status)
  }
  return body as T
}
