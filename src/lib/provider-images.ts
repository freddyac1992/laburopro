import { getSupabaseUrl } from '@/lib/supabase/config'

export const PROVIDER_IMAGES_BUCKET = 'provider-images'

export function getProviderImageUrl(path: string | null | undefined, version?: string) {
  if (!path) return null

  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const versionQuery = version ? `?v=${encodeURIComponent(version)}` : ''
  return `${getSupabaseUrl()}/storage/v1/object/public/${PROVIDER_IMAGES_BUCKET}/${encodedPath}${versionQuery}`
}

export async function compressProviderImage(
  file: File,
  dimensions: { width: number; height: number }
) {
  const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
  if (!acceptedTypes.has(file.type)) {
    throw new Error('Usa una imagen JPG, PNG o WebP.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen original no puede superar 10 MB.')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, dimensions.width / bitmap.width, dimensions.height / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    bitmap.close()
    throw new Error('Tu navegador no pudo procesar la imagen.')
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  let lastBlob: Blob | null = null
  for (const quality of [0.82, 0.7, 0.58, 0.46]) {
    lastBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
    if (lastBlob && lastBlob.size <= 850 * 1024) return lastBlob
  }

  if (!lastBlob) throw new Error('No se pudo convertir la imagen.')
  throw new Error('La imagen sigue siendo demasiado pesada después de comprimirla.')
}
