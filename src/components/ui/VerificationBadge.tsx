export default function VerificationBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  }

  return (
    <span
      className={`verified-badge inline-flex items-center font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full ${sizes[size]}`}
      title="Proveedor verificado por LaburoPro"
    >
      <svg className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      Verificado
    </span>
  )
}
