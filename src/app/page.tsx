import type { Metadata } from 'next'
import Image from 'next/image'
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
    step: '01',
    title: 'Busca lo que necesitas',
    description: 'Elige el servicio y tu ciudad para ver profesionales disponibles en tu zona.',
  },
  {
    step: '02',
    title: 'Compara con confianza',
    description: 'Revisa experiencia, fotos de trabajos, referencias de precio y reseñas reales.',
  },
  {
    step: '03',
    title: 'Habla directamente',
    description: 'Contacta al proveedor por WhatsApp y acuerda los detalles sin intermediarios.',
  },
]

const TRUST_FEATURES = [
  { icon: '✓', title: 'Revisión manual', desc: 'Cada perfil pasa por nuestro equipo antes de aparecer públicamente.' },
  { icon: '★', title: 'Reputación visible', desc: 'Reseñas moderadas, reportes y señales claras para decidir mejor.' },
  { icon: '↗', title: 'Contacto directo', desc: 'Sin comisiones ni formularios eternos. Conversas por WhatsApp.' },
  { icon: 'BO', title: 'Hecho para Bolivia', desc: 'Categorías, ciudades y dinámica pensadas para el mercado local.' },
]

const POPULAR_CATEGORIES = CATEGORIES.slice(0, 8)

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[610px] md:min-h-[650px] flex items-end md:items-center overflow-hidden text-white">
        <Image
          src="/images/laburopro-hero.png"
          alt="Profesional boliviano en un trabajo de remodelación"
          fill
          priority
          sizes="100vw"
          className="hero-photo object-cover object-[68%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-[#08252f]/30" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-4xl">
            <p className="border-l-4 border-[#e85d3f] pl-3 text-sm font-bold mb-5">
              Servicios locales verificados en Bolivia
            </p>
            <h1 className="max-w-3xl text-4xl md:text-6xl font-extrabold leading-[1.08] mb-5">
              Profesionales de confianza, cerca de ti.
            </h1>
            <p className="max-w-2xl text-base md:text-xl text-white/90 leading-relaxed mb-8">
              Encuentra, compara y contacta directamente a personas que saben hacer el trabajo.
            </p>
            <SearchBar />
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm text-white/85">
              <span>Perfiles revisados</span>
              <span>Contacto por WhatsApp</span>
              <span>Sin comisiones</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
            <div className="px-2 sm:px-4">
              <p className="text-2xl md:text-3xl font-extrabold text-teal-700">14+</p>
              <p className="text-xs text-slate-500 mt-1">Categorías</p>
            </div>
            <div className="px-2 sm:px-4">
              <p className="text-2xl md:text-3xl font-extrabold text-[#102a33]">10</p>
              <p className="text-xs text-slate-500 mt-1">Ciudades</p>
            </div>
            <div className="px-2 sm:px-4">
              <p className="text-2xl md:text-3xl font-extrabold text-[#e85d3f]">100%</p>
              <p className="text-xs text-slate-500 mt-1">Perfiles revisados</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#f6f8f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-sm font-bold text-teal-700 mb-2">Explora por oficio</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#102a33]">Servicios más buscados</h2>
            </div>
            <Link
              href="/servicios"
              id="view-all-categories-btn"
              className="text-teal-700 font-bold text-sm hover:text-teal-800 hidden sm:block"
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
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
            <Link href="/servicios" className="text-teal-700 font-bold text-sm">
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-bold text-[#e85d3f] mb-2">Simple desde el inicio</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#102a33] mb-3">Del problema al contacto en tres pasos</h2>
            <p className="text-slate-600">Información útil para elegir bien, sin añadir fricción al proceso.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-slate-200">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="py-7 md:px-7 border-b md:border-b-0 md:border-r last:border-r-0 border-slate-200">
                <span className="text-sm font-extrabold text-teal-700">{step.step}</span>
                <h3 className="font-bold text-[#102a33] text-lg mt-4 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#123b42] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
            <div>
              <p className="text-sm font-bold text-teal-200 mb-2">Confianza con señales reales</p>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Más claridad antes de contratar.</h2>
              <p className="text-slate-300 leading-relaxed">LaburoPro organiza la información que normalmente está dispersa para que puedas decidir con calma.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-white/15">
              {TRUST_FEATURES.map((feature) => (
                <div key={feature.title} className="py-6 sm:px-6 border-b sm:border-r even:border-r-0 border-white/15">
                  <div className="w-8 h-8 rounded-md bg-[#e85d3f] flex items-center justify-center text-xs font-extrabold mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-teal-700 mb-2">Para quienes hacen el trabajo</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#102a33] mb-3">Tu próximo cliente puede estar buscando ahora.</h2>
            <p className="text-slate-600 text-lg">Publica tu servicio gratis y recibe contactos directos por WhatsApp.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/registro"
              id="provider-cta-btn"
              className="px-7 py-3.5 bg-[#e85d3f] hover:bg-[#cf4f34] text-white font-bold rounded-md text-center"
            >
              Publicar mi servicio
            </Link>
            <Link
              href="/#como-funciona"
              className="px-7 py-3.5 border border-slate-300 hover:border-teal-600 text-[#102a33] font-bold rounded-md text-center"
            >
              Ver cómo funciona
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
