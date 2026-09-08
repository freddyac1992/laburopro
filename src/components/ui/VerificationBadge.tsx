import { BadgeCheck } from 'lucide-react'

export default function VerificationBadge({ size = 'sm' }: { readonly size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  }
  const iconSizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }

  return (
    <span
      className={`verified-badge inline-flex items-center font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full ${sizes[size]}`}
      title="Identidad confirmada por LaburoPro"
    >
      <BadgeCheck className={`shrink-0 ${iconSizes[size]}`} aria-hidden="true" />
      Identidad confirmada
    </span>
  )
}
