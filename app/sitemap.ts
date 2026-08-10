import type { MetadataRoute } from 'next'
import { getPublishedProducts } from '@/features/store/data/products'
import { getPublicCategories }  from '@/features/store/data/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanz.tech'

  const [{ products }, categories] = await Promise.all([
    getPublishedProducts(undefined, 1, 500).catch(() => ({ products: [] })),
    getPublicCategories().catch(() => []),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${siteUrl}/catalog`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${siteUrl}/about`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/contact`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/faq`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/warranty`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/shipping`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
    url:             `${siteUrl}/category/${c.slug}`,
    lastModified:    new Date(),
    changeFrequency: 'daily' as const,
    priority:        0.7,
  }))

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url:             `${siteUrl}/product/${p.slug}`,
    lastModified:    new Date(),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}
