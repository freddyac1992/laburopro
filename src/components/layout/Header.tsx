'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import BrandLogo from '@/components/brand/BrandLogo'
import FavoritesNavLink from './FavoritesNavLink'
import { NAV_LINKS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types/database'

function getGoogleAccountName(user: {
  email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  const fullName = user.user_metadata?.full_name
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()

  const name = user.user_metadata?.name
  if (typeof name === 'string' && name.trim()) return name.trim()

  return user.email ?? 'Usuario'
}

export default function Header() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [dashboardHref, setDashboardHref] = useState('/dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [accountName, setAccountName] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function loadSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setIsLoggedIn(Boolean(user))

      if (user) {
        const { data: profile } = (await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle()) as { data: { role: Role; full_name: string | null } | null }

        setDashboardHref(profile?.role === 'admin' ? '/admin' : '/dashboard')
        setAccountName(profile?.full_name?.trim() || getGoogleAccountName(user))
      } else {
        setAccountName('')
      }

      setCheckingSession(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user))
      setAccountName(session?.user ? getGoogleAccountName(session.user) : '')
      setDashboardHref('/dashboard')
      setCheckingSession(false)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router])

  const closeMenu = () => setMenuOpen(false)

  const authLinks = isLoggedIn ? (
    <>
      <div className="min-w-0 max-w-40" title={`Cuenta: ${accountName}`}>
        <p className="text-xs text-slate-500">Cuenta</p>
        <p className="truncate text-sm font-semibold text-slate-800">{accountName}</p>
      </div>
      <Link
        href={dashboardHref}
        id="header-dashboard-btn"
        className="text-sm font-semibold bg-teal-700 text-white px-4 py-2 rounded-md hover:bg-teal-800"
      >
        Mis trabajos
      </Link>
      <LogoutButton
        id="header-logout-btn"
        className="text-sm font-medium text-slate-700 hover:text-red-600 px-4 py-2 rounded-md hover:bg-red-50"
      >
        Cerrar sesión
      </LogoutButton>
    </>
  ) : (
    <>
      <Link
        href="/login"
        id="header-login-btn"
        className="text-sm font-medium text-slate-700 hover:text-teal-700 px-4 py-2 rounded-md hover:bg-teal-50"
      >
        Ingresar
      </Link>
      <Link
        href="/registro"
        id="header-register-btn"
        className="text-sm font-semibold bg-[#e85d3f] text-white px-4 py-2 rounded-md hover:bg-[#cf4f34]"
      >
        Ofrecer mi trabajo
      </Link>
    </>
  )

  const mobileAuthLinks = isLoggedIn ? (
    <>
      <div className="rounded-md bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">Has ingresado como</p>
        <p className="break-words font-semibold text-slate-900">{accountName}</p>
      </div>
      <Link
        href={dashboardHref}
        className="block px-4 py-2 bg-teal-700 text-white rounded-md font-semibold text-center hover:bg-teal-800"
        onClick={closeMenu}
      >
        Mis trabajos
      </Link>
      <LogoutButton
        className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium"
        onClick={closeMenu}
      >
        Cerrar sesión
      </LogoutButton>
    </>
  ) : (
    <>
      <Link
        href="/login"
        className="block px-4 py-2 text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded-md font-medium"
        onClick={closeMenu}
      >
        Ingresar
      </Link>
      <Link
        href="/registro"
        className="block px-4 py-2 bg-[#e85d3f] text-white rounded-md font-semibold text-center hover:bg-[#cf4f34]"
        onClick={closeMenu}
      >
        Ofrecer mi trabajo
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl" id="header-logo" aria-label="LaburoPro, inicio">
            <BrandLogo markClassName="h-9 w-9" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 hover:text-teal-700 font-semibold text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <FavoritesNavLink />
            {!checkingSession && authLinks}
          </div>

          {!checkingSession && isLoggedIn && (
            <div className="ml-auto min-w-0 max-w-24 md:hidden" title={`Cuenta: ${accountName}`}>
              <p className="text-[11px] leading-tight text-slate-500">Cuenta</p>
              <p className="truncate text-xs font-semibold text-slate-800">{accountName}</p>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            id="header-mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg font-medium"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <FavoritesNavLink mobile onClick={closeMenu} />
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {!checkingSession && mobileAuthLinks}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
