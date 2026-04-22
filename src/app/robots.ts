import type { MetadataRoute } from 'next'

const SITE_URL = 'https://drivefindersg.uqlabs.co'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/success', '/social'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
