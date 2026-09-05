import Link from 'next/link'
import { ArrowRight, Baby, BookOpen, BrickWall, Car, ClipboardList, CookingPot, Hammer, HeartHandshake, House, Laptop, PaintRoller, Sparkles, Truck, Wrench, Zap } from 'lucide-react'

const CATEGORY_ICONS = {
  albaniles: BrickWall,
  plomeros: Wrench,
  carpinteros: Hammer,
  electricistas: Zap,
  pintores: PaintRoller,
  limpieza: Sparkles,
  'empleadas-domesticas': House,
  nineras: Baby,
  'cuidadores-adultos-mayores': HeartHandshake,
  'fletes-y-mudanzas': Truck,
  'gestores-tramites': ClipboardList,
  mecanicos: Car,
  'tecnicos-de-computadora': Laptop,
  tutores: BookOpen,
  'comida-casera-catering': CookingPot,
}

interface CategoryCardProps {
  readonly name: string
  readonly slug: string
  readonly icon: string
  readonly description?: string | null
  readonly providerCount?: number
}

export default function CategoryCard({ name, slug, description, providerCount }: CategoryCardProps) {
  const Icon = CATEGORY_ICONS[slug as keyof typeof CATEGORY_ICONS] ?? Wrench
  return (
    <Link
      href={`/servicios/${slug}`}
      className="category-card flex flex-col items-start text-left bg-white rounded-lg border border-slate-200 p-4 sm:p-5 hover:border-teal-600 group min-w-0"
      id={`category-card-${slug}`}
    >
      <div className="flex w-full items-center justify-between text-teal-700 mb-4">
        <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
        <ArrowRight size={16} aria-hidden="true" />
      </div>
      <h3 className="font-bold text-[#102a33] text-base leading-snug mb-1 [overflow-wrap:anywhere]">{name}</h3>
      {description && (
        <p className="text-slate-600 text-sm leading-relaxed hidden sm:block">{description}</p>
      )}
      {typeof providerCount === 'number' && (
        <span className="mt-2 text-xs text-teal-700 font-semibold">
          {providerCount} proveedor{providerCount !== 1 ? 'es' : ''}
        </span>
      )}
    </Link>
  )
}
