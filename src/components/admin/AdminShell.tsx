import Link from 'next/link'
import { ArrowLeft, BadgeCheck, ChartNoAxesCombined, ContactRound, LogOut, ShieldAlert, Star, Users } from 'lucide-react'
import LogoutButton from '@/components/auth/LogoutButton'
import BrandLogo from '@/components/brand/BrandLogo'

const navItems = [
  { label: 'Resumen', href: '/admin', icon: ChartNoAxesCombined },
  { label: 'Proveedores', href: '/admin/proveedores', icon: Users },
  { label: 'Verificaciones', href: '/admin/verificaciones', icon: BadgeCheck },
  { label: 'Contactos', href: '/admin/contactos', icon: ContactRound },
  { label: 'Reseñas', href: '/admin/resenas', icon: Star },
  { label: 'Reportes', href: '/admin/reportes', icon: ShieldAlert },
]

interface AdminShellProps {
  readonly children: React.ReactNode
  readonly title?: string
}

export default function AdminShell({ children, title }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-100 min-h-screen">
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/" className="text-lg" aria-label="LaburoPro, inicio">
            <BrandLogo markClassName="h-8 w-8" textClassName="text-white" inverseMark />
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Administración</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white font-medium text-sm transition-colors"
              id={`admin-nav-${item.href.replace(/\//g, '-')}`}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 pb-4 border-t border-gray-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white font-medium text-sm transition-colors"
            id="admin-back-site"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al sitio
          </Link>
          <LogoutButton
            className="mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-950 hover:text-red-100 font-medium text-sm transition-colors"
            id="admin-logout-btn"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
          </LogoutButton>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <Link href="/" aria-label="LaburoPro, inicio">
            <BrandLogo markClassName="h-7 w-7" textClassName="text-white" inverseMark />
          </Link>
          <LogoutButton
            className="text-sm text-gray-200 hover:text-white"
            id="admin-mobile-logout-btn"
          >
            Cerrar sesión
          </LogoutButton>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden" aria-label="Administración">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800"><item.icon className="h-4 w-4" aria-hidden="true" />{item.label}</Link>)}
        </nav>
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-10">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
