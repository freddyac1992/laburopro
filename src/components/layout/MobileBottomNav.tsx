'use client'

import Link from 'next/link'
import { Heart, Home, Search, UserRound } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface MobileBottomNavProps {
  readonly accountHref: string
}

export default function MobileBottomNav({ accountHref }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = [
    { label: 'Inicio', href: '/', icon: Home, active: pathname === '/' },
    { label: 'Buscar', href: '/servicios', icon: Search, active: pathname.startsWith('/servicios') || pathname.startsWith('/proveedores') },
    { label: 'Guardados', href: '/guardados', icon: Heart, active: pathname === '/guardados' },
    { label: 'Mi cuenta', href: accountHref, icon: UserRound, active: pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/login' },
  ]

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navegación principal en móvil"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(16,42,51,0.08)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              id={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              aria-current={item.active ? 'page' : undefined}
              className={`press-feedback flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-bold ${
                item.active ? 'text-teal-800' : 'text-slate-500'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={item.active ? 2.4 : 1.9}
                fill={item.label === 'Guardados' && item.active ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
