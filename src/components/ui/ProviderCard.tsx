import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react'
import VerificationBadge from './VerificationBadge'
import FavoriteButton from './FavoriteButton'
import StarRating from './StarRating'
import { truncate, getInitials } from '@/lib/utils'
import { getProviderImageUrl } from '@/lib/provider-images'

interface ProviderCardProps {
  readonly id: string
  readonly slug: string
  readonly displayName: string
  readonly categoryName?: string
  readonly cityName?: string
  readonly zone?: string | null
  readonly description?: string | null
  readonly priceReference?: string | null
  readonly rating?: number
  readonly reviewCount?: number
  readonly isVerified?: boolean
  readonly yearsExperience?: number | null
  readonly profilePhotoPath?: string | null
  readonly workPhotoPath?: string | null
  readonly imageVersion?: string
}

export default function ProviderCard({
  id,
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
  workPhotoPath,
  imageVersion,
}: ProviderCardProps) {
  const initials = getInitials(displayName)
  const profilePhotoUrl = getProviderImageUrl(profilePhotoPath, imageVersion)
  const workPhotoUrl = getProviderImageUrl(workPhotoPath, imageVersion)
  const favoriteProvider = {
    id,
    slug,
    displayName,
    categoryName,
    cityName,
    zone,
    description,
    priceReference,
    rating,
    reviewCount,
    isVerified,
    yearsExperience,
    profilePhotoPath,
    workPhotoPath,
    imageVersion,
  }

  return (
    <article className="provider-card relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white group">
      <FavoriteButton
        provider={favoriteProvider}
        className="absolute right-3 top-3 z-10 rounded-md shadow-sm"
      />
      <Link href={`/proveedores/${slug}`} className="flex flex-1 flex-col" id={`provider-card-${slug}`}>
        {workPhotoUrl && (
          <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
            <Image
              src={workPhotoUrl}
              alt={`Trabajo realizado por ${displayName}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="absolute bottom-3 left-4 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-bold text-white">Trabajo realizado</span>
          </div>
        )}

        <div className="flex items-start gap-4 p-5 pb-3">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-teal-700 text-lg font-bold text-white">
            {profilePhotoUrl ? (
              <Image src={profilePhotoUrl} alt={`Foto de ${displayName}`} fill sizes="64px" className="object-cover" />
            ) : initials}
          </div>
          <div className="min-w-0 flex-1 pr-9">
            <h3 className="break-words text-lg font-extrabold leading-snug text-[#102a33] [overflow-wrap:anywhere] group-hover:text-teal-700">{displayName}</h3>
            {categoryName && <p className="mt-1 text-sm font-bold text-teal-700">{categoryName}</p>}
            {(cityName || zone) && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{[zone, cityName].filter(Boolean).join(', ')}</span>
              </p>
            )}
          </div>
        </div>

        <div className="min-h-7 px-5">
          {isVerified && <VerificationBadge size="sm" />}
        </div>

        {description && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{truncate(description, 115)}</p>}

        <div className="mt-auto border-t border-slate-100 px-5 py-4">
          <div className="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {rating > 0 ? (
              <>
                <StarRating value={rating} size="sm" label="Calificación promedio" />
                <span className="font-extrabold text-[#102a33]">{rating.toFixed(1)}</span>
                <span className="text-slate-500">{reviewCount} opinión{reviewCount !== 1 ? 'es' : ''}</span>
              </>
            ) : (
              <span className="text-slate-500">Aún sin reseñas</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {typeof yearsExperience === 'number' && yearsExperience > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
                {yearsExperience} año{yearsExperience !== 1 ? 's' : ''} de experiencia
              </span>
            )}
            {priceReference && <span className="rounded-md bg-[#fff1ed] px-2.5 py-1.5 text-xs font-bold text-[#9a3e2b]">{priceReference}</span>}
          </div>
          <span className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-md bg-teal-700 px-4 text-sm font-extrabold text-white group-hover:bg-teal-800">
            Ver trabajo y contactar
            <ArrowRight size={18} aria-hidden="true" className="shrink-0" />
          </span>
        </div>
      </Link>
    </article>
  )
}
