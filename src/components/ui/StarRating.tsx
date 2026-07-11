'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
}

function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`${className} ${filled ? 'text-amber-400' : 'text-slate-200'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function StarRating({ value, onChange, size = 'md', label = 'Calificación' }: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)
  const displayValue = hoveredValue ?? Math.round(value)
  const interactive = Boolean(onChange)

  if (!interactive) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label}: ${value} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= displayValue} className={SIZE_CLASSES[size]} />
        ))}
      </span>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label={label}
      onMouseLeave={() => setHoveredValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} estrella${star === 1 ? '' : 's'}`}
          title={`${star} estrella${star === 1 ? '' : 's'}`}
          onMouseEnter={() => setHoveredValue(star)}
          onFocus={() => setHoveredValue(star)}
          onBlur={() => setHoveredValue(null)}
          onClick={() => onChange?.(star)}
          className="p-1 rounded-md hover:bg-amber-50 focus-visible:outline-amber-500"
        >
          <StarIcon filled={star <= displayValue} className={SIZE_CLASSES[size]} />
        </button>
      ))}
    </div>
  )
}
