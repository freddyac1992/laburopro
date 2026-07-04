import type { Metadata } from 'next'
import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'
import CategoryCard from '@/components/ui/CategoryCard'
import { CATEGORIES, SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `${SITE_NAME} — Servicios verificados cerca de ti`,
  description:
    'Encuentra plomeros, albañiles, electricistas, fletes, cuidadores, tutores y más en Bolivia. Proveedores verificados en Santa Cruz, La Paz, Cochabamba y todo el país.',
}

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Busca por ciudad y categoría',
    description: 'Selecciona el servicio que necesitas y tu ciudad. Encuentra proveedores cercanos a ti.',
    icon: '🔍',
  },
  {
    step: '2',
    title: 'Revisa perfiles verificados',
    description: 'Lee descripciones, experiencia, precios de referencia y reseñas de cada proveedor.',
    icon: '✅',
  },
  {
    step: '3',
    title: 'Contacta por WhatsApp',
    description: 'Un solo toque y hablas directo con el proveedor. Sin intermediarios.',
    icon: '💬',
  },
]

const TRUST_FEATURES = [
  { icon: '🛡️', title: 'Proveedores revisados manualmente', desc: 'Cada perfil es aprobado por nuestro equipo antes de publicarse.' },
  { icon: '📋', title: 'Perfiles con referencias y experiencia', desc: 'Información real: zona, experiencia, precios y servicios.' },
  { icon: '⭐', title: 'Reseñas y reportes de usuarios', desc: 'La comunidad califica y reporta. Tú decides con confianza.' },
  { icon: '🇧🇴', title: 'Enfoque local para Bolivia', desc: 'Diseñado para la realidad boliviana. En tu idioma, en tu ciudad.' },
]

const POPULAR_CATEGORIES = CATEGORIES.slice(0, 8)

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-gradient text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              🇧🇴 El marketplace de servicios de Bolivia
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Encuentra servicios{' '}
              <span className="text-orange-400">verificados</span>{' '}
              cerca de ti
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl">
              Plomeros, albañiles, fletes, cuidadores, tutores, mecánicos y más.
              Todo en un solo lugar.
            </p>
            <SearchBar />
            <p className="mt-4 text-blue-200 text-sm">
              Disponible en Santa Cruz, La Paz, Cochabamba y más ciudades
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
            <div className="px-4">
              <p className="text-2xl md:text-3xl font-extrabold text-blue-700">14+</p>
              <p className="text-xs text-gray-500 mt-1">Categorías de servicio</p>
            </div>
            <div className="px-4">
              <p className="text-2xl md:text-3xl font-extrabold text-blue-700">10</p>
              <p className="text-xs text-gray-500 mt-1">Ciudades de Bolivia</p>
            </div>
            <div className="px-4">
              <p className="text-2xl md:text-3xl font-extrabold text-blue-700">100%</p>
              <p className="text-xs text-gray-500 mt-1">Proveedores revisados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular categories */}
      <section className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Servicios populares</h2>
              <p className="text-gray-500 mt-1">Los más buscados en Bolivia</p>
            </div>
            <Link
              href="/servicios"
              id="view-all-categories-btn"
              className="text-blue-700 font-semibold text-sm hover:text-blue-800 hidden sm:block"
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {POPULAR_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.slug}
                name={cat.name}
                slug={cat.slug}
                icon={cat.icon}
                description={cat.description}
              />
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/servicios"
              className="text-blue-700 font-semibold text-sm"
            >
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Encontrar un profesional de confianza es fácil y rápido
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-4 shadow-sm">
                  {step.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-lg">{step.title}</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="section-padding bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              ¿Por qué confiar en LaburoPro?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Construimos confianza en cada paso del proceso
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="trust-item bg-white rounded-2xl p-6 border border-blue-100 hover:shadow-md"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{feature.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-4xl mb-4">💼</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Tienes un oficio o servicio?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Crea tu perfil en LaburoPro y recibe clientes por WhatsApp.{' '}
              <strong className="text-white">Gratis, rápido, sin comisiones.</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/registro"
                id="provider-cta-btn"
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-lg transition-colors"
              >
                Registrarme como proveedor
              </Link>
              <Link
                href="/#como-funciona"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Cómo funciona
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
