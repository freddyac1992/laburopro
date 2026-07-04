import Link from 'next/link'

interface CategoryCardProps {
  name: string
  slug: string
  icon: string
  description?: string | null
  providerCount?: number
}

export default function CategoryCard({ name, slug, icon, description, providerCount }: CategoryCardProps) {
  return (
    <Link
      href={`/servicios/${slug}`}
      className="category-card flex flex-col items-center text-center bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 group"
      id={`category-card-${slug}`}
    >
      <div className="w-14 h-14 flex items-center justify-center bg-blue-50 rounded-2xl text-3xl mb-3 group-hover:bg-blue-100 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{name}</h3>
      {description && (
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 hidden sm:block">{description}</p>
      )}
      {typeof providerCount === 'number' && (
        <span className="mt-2 text-xs text-blue-600 font-medium">
          {providerCount} proveedor{providerCount !== 1 ? 'es' : ''}
        </span>
      )}
    </Link>
  )
}
