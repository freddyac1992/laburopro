export function authErrorMessage(code: string | null): string | null {
  if (!code) return null
  if (code === 'access_denied') return 'No se completó el permiso de Google. Para entrar, vuelve a elegir tu cuenta y acepta continuar.'
  if (code === 'flow_state_expired' || code === 'flow_state_not_found') return 'Este intento de acceso ya venció. Pulsa “Continuar con Google” para empezar de nuevo.'
  return 'No pudimos completar el acceso con Google. Inténtalo otra vez desde esta página con el mismo correo de tu cuenta.'
}
