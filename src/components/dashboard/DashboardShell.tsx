'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, UserRound, ShieldCheck, MessageCircle, LogOut } from 'lucide-react'
import LogoutButton from '@/components/auth/LogoutButton'
import BrandLogo from '@/components/brand/BrandLogo'

const navItems = [
  { label: 'Inicio', mobileLabel: 'Inicio', href: '/dashboard', icon: House },
  { label: 'Mi información', mobileLabel: 'Mi perfil', href: '/dashboard/perfil', icon: UserRound },
  { label: 'Confirmar identidad', mobileLabel: 'Identidad', href: '/dashboard/verificacion', icon: ShieldCheck },
  { label: 'Personas interesadas', mobileLabel: 'Contactos', href: '/dashboard/contactos', icon: MessageCircle },
]

interface DashboardShellProps {
  readonly children: React.ReactNode
  readonly title?: string
  readonly newLeadCount?: number
}

export default function DashboardShell({ children, title, newLeadCount = 0 }: DashboardShellProps) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex shrink-0 flex-col w-60 bg-white border-r border-gray-200 min-h-screen">
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/" className="text-lg" aria-label="LaburoPro, inicio">
            <BrandLogo markClassName="h-8 w-8" />
          </Link>
          <p className="text-sm text-gray-600 mt-1">Mi cuenta de trabajo</p>
        </div>
        <nav aria-label="Panel del proveedor" className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`flex min-h-12 items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 font-medium text-sm transition-colors ${pathname === item.href ? 'bg-teal-50 text-teal-800' : 'text-gray-700'}`}
              id={`dashboard-nav-${item.href.replace(/\//g, '-')}`}
            >
              <item.icon size={18} className="shrink-0" aria-hidden="true" />{item.label}
              {item.href === '/dashboard/contactos' && newLeadCount > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                  {newLeadCount > 99 ? '99+' : newLeadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="px-4 pb-4">
          <LogoutButton
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium text-sm transition-colors w-full"
            id="dashboard-logout-btn"
          >
            <LogOut size={18} aria-hidden="true" />Cerrar sesión
          </LogoutButton>
        </div>
      </aside>

      {/* Mobile top bar */}
      <nav aria-label="Panel del proveedor móvil" className="md:hidden grid grid-cols-4 gap-1 border-b border-gray-200 bg-white px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold hover:bg-teal-50 ${pathname === item.href ? 'bg-teal-50 text-teal-800' : 'text-gray-700'}`}
          >
            <item.icon size={20} aria-hidden="true" />{item.mobileLabel}
            {item.href === '/dashboard/contactos' && newLeadCount > 0 && (
              <span className="absolute right-1 top-0 min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                {newLeadCount > 99 ? '99+' : newLeadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 md:py-10">
          {title && (
            <h1 className="break-words text-2xl font-bold text-gray-900 mb-6">{title}</h1>
          )}
          {children}
          <LogoutButton className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 md:hidden" id="dashboard-mobile-logout-btn"><LogOut size={18} aria-hidden="true" />Cerrar sesión</LogoutButton>
        </div>
      </div>
    </div>
  )
}
