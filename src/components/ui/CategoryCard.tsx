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
      className="category-card flex flex-col items-start text-left bg-white rounded-lg border border-slate-200 p-5 hover:border-teal-300 group"
      id={`category-card-${slug}`}
    >
      <div className="w-12 h-12 flex items-center justify-center bg-teal-50 rounded-md text-2xl mb-4 group-hover:bg-teal-100 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-[#102a33] text-sm leading-tight mb-1">{name}</h3>
      {description && (
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 hidden sm:block">{description}</p>
      )}
      {typeof providerCount === 'number' && (
        <span className="mt-2 text-xs text-teal-700 font-semibold">
          {providerCount} proveedor{providerCount !== 1 ? 'es' : ''}
        </span>
      )}
    </Link>
  )
}
