import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants'

const navItems = [
  { label: 'Panel principal', href: '/dashboard', icon: '🏠' },
  { label: 'Mi perfil', href: '/dashboard/perfil', icon: '👤' },
]

interface DashboardShellProps {
  children: React.ReactNode
  title?: string
}

export default function DashboardShell({ children, title }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/" className="font-bold text-blue-700 text-lg">
            {SITE_NAME}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">Panel de proveedor</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium text-sm transition-colors"
              id={`dashboard-nav-${item.href.replace(/\//g, '-')}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 pb-4">
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium text-sm transition-colors w-full"
            id="dashboard-logout-btn"
          >
            <span>🚪</span> Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-2 flex gap-4 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 md:py-10 mt-10 md:mt-0">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
