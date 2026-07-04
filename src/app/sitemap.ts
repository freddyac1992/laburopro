import { MetadataRoute } from 'next'
import { CATEGORIES, CITIES, SITE_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/servicios`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/servicios/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const categoryyCityPages: MetadataRoute.Sitemap = CATEGORIES.flatMap((cat) =>
    CITIES.map((city) => ({
      url: `${SITE_URL}/servicios/${cat.slug}/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  )

  return [...staticPages, ...categoryPages, ...categoryyCityPages]
}
