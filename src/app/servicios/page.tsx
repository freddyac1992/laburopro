import type { Metadata } from 'next'
import CategoryCard from '@/components/ui/CategoryCard'
import { CATEGORIES, SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Todos los servicios — ${SITE_NAME}`,
  description:
    'Explora todas las categorías de servicios disponibles en LaburoPro. Plomeros, albañiles, electricistas, niñeras, tutores, fletes y muchos más en Bolivia.',
}

export default function ServiciosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Todos los servicios
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Encuentra el profesional que necesitas. Proveedores verificados en toda Bolivia.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.slug}
            name={cat.name}
            slug={cat.slug}
            icon={cat.icon}
            description={cat.description}
          />
        ))}
      </div>

      {/* Cities hint */}
      <div className="mt-12 bg-blue-50 rounded-2xl p-6 text-center">
        <p className="text-gray-700 font-medium mb-2">¿Buscas en una ciudad específica?</p>
        <p className="text-gray-500 text-sm">
          Selecciona una categoría y luego filtra por tu ciudad: Santa Cruz, La Paz, Cochabamba y más.
        </p>
      </div>
    </div>
  )
}
