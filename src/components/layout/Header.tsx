'use client'

import Link from 'next/link'
import { useState } from 'react'
import { NAV_LINKS, SITE_NAME } from '@/lib/constants'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" id="header-logo">
            <span className="bg-blue-700 text-white px-2 py-1 rounded-lg text-sm font-extrabold tracking-tight">
              LP
            </span>
            <span className="text-gray-900">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-blue-700 font-medium text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              id="header-login-btn"
              className="text-sm font-medium text-gray-700 hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50"
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              id="header-register-btn"
              className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
            >
              Publicar servicio
            </Link>
          </div>

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
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <Link
                href="/login"
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="block px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold text-center hover:bg-blue-800"
                onClick={() => setMenuOpen(false)}
              >
                Publicar servicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
