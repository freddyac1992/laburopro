'use client'

import { useState } from 'react'

interface LogoutButtonProps {
  id?: string
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

export default function LogoutButton({
  id,
  className = '',
  children = 'Cerrar sesión',
  onClick,
}: LogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSigningOut) return

    const form = event.currentTarget
    setIsSigningOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })

      if (!response.ok) throw new Error('No se pudo cerrar la sesión.')

      onClick?.()
      window.location.assign('/login')
    } catch {
      form.submit()
    }
  }

  return (
    <form action="/api/auth/logout" method="post" onSubmit={handleSubmit}>
      <button type="submit" id={id} className={className} disabled={isSigningOut} aria-busy={isSigningOut}>
        {isSigningOut ? 'Cerrando sesión...' : children}
      </button>
    </form>
  )
}
