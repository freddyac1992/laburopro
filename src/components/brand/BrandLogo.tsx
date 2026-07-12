interface BrandMarkProps {
  className?: string
  inverse?: boolean
}

export function BrandMark({ className = 'h-9 w-9', inverse = false }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 5h31v12H18v20h19v12H6V5Z" fill="#0f766e" />
      <path d="M27 20h31v39H27V47h19V32H27V20Z" fill={inverse ? '#ffffff' : '#102a33'} />
      <path d="M27 20h10v12H27V20Z" fill="#e85d3f" />
    </svg>
  )
}

interface BrandLogoProps {
  className?: string
  markClassName?: string
  textClassName?: string
  showWordmark?: boolean
  inverseMark?: boolean
}

export default function BrandLogo({
  className = '',
  markClassName,
  textClassName = 'text-[#102a33]',
  showWordmark = true,
  inverseMark = false,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className={markClassName} inverse={inverseMark} />
      {showWordmark && (
        <span className={`font-extrabold tracking-normal ${textClassName}`}>LaburoPro</span>
      )}
    </span>
  )
}
