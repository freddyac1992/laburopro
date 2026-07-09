'use client'

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
  return (
    <form action="/api/auth/logout" method="post">
      <button type="submit" id={id} className={className} onClick={onClick}>
        {children}
      </button>
    </form>
  )
}
