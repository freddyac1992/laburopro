import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import BrandLogo from '@/components/brand/BrandLogo'

const navItems = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Mi información', href: '/dashboard/perfil' },
  { label: 'Personas interesadas', href: '/dashboard/contactos' },
]

interface DashboardShellProps {
  children: React.ReactNode
  title?: string
  newLeadCount?: number
}

export default function DashboardShell({ children, title, newLeadCount = 0 }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/" className="text-lg" aria-label="LaburoPro, inicio">
            <BrandLogo markClassName="h-8 w-8" />
          </Link>
          <p className="text-sm text-gray-600 mt-1">Mi cuenta de trabajo</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-teal-50 hover:text-teal-700 font-medium text-sm transition-colors"
              id={`dashboard-nav-${item.href.replace(/\//g, '-')}`}
            >
              {item.label}
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
            Cerrar sesión
          </LogoutButton>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-2 flex gap-4 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-teal-50 hover:text-teal-700 font-medium text-sm whitespace-nowrap"
          >
            {item.label}
            {item.href === '/dashboard/contactos' && newLeadCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                {newLeadCount > 99 ? '99+' : newLeadCount}
              </span>
            )}
          </Link>
        ))}
        <LogoutButton
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium text-sm whitespace-nowrap"
          id="dashboard-mobile-logout-btn"
        >
          Cerrar sesión
        </LogoutButton>
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
