import Link from 'next/link'
import Image from 'next/image'
import VerificationBadge from './VerificationBadge'
import { truncate, getInitials } from '@/lib/utils'
import { getProviderImageUrl } from '@/lib/provider-images'

interface ProviderCardProps {
  id: string
  slug: string
  displayName: string
  categoryName?: string
  cityName?: string
  zone?: string | null
  description?: string | null
  priceReference?: string | null
  rating?: number
  reviewCount?: number
  isVerified?: boolean
  yearsExperience?: number | null
  profilePhotoPath?: string | null
  imageVersion?: string
}

export default function ProviderCard({
  slug,
  displayName,
  categoryName,
  cityName,
  zone,
  description,
  priceReference,
  rating = 0,
  reviewCount = 0,
  isVerified = false,
  yearsExperience,
  profilePhotoPath,
  imageVersion,
}: ProviderCardProps) {
  const initials = getInitials(displayName)
  const profilePhotoUrl = getProviderImageUrl(profilePhotoPath, imageVersion)

  return (
    <Link
      href={`/proveedores/${slug}`}
      className="provider-card flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-teal-300 group"
      id={`provider-card-${slug}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0 w-14 h-14 overflow-hidden rounded-md bg-teal-700 flex items-center justify-center text-white font-bold text-lg">
          {profilePhotoUrl ? (
            <Image
              src={profilePhotoUrl}
              alt={`Foto de ${displayName}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate group-hover:text-teal-700 transition-colors">
              {displayName}
            </h3>
            {isVerified && <VerificationBadge size="sm" />}
          </div>

          {categoryName && (
            <p className="text-teal-700 text-sm font-semibold mt-0.5">{categoryName}</p>
          )}

          {(cityName || zone) && (
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {zone ? `${zone}, ${cityName}` : cityName}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="px-5 pb-3 text-gray-600 text-sm leading-relaxed">
          {truncate(description, 100)}
        </p>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          {priceReference && (
            <span className="text-sm font-semibold text-gray-800">{priceReference}</span>
          )}
          {yearsExperience && (
            <span className="text-xs text-gray-500">{yearsExperience} año{yearsExperience !== 1 ? 's' : ''} exp.</span>
          )}
        </div>
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
