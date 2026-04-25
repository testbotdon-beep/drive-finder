import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { UniqHeader } from '@/components/uniq-header'

const SITE_URL = 'https://drivefindersg.uqlabs.co'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Drive Finder SG | Find a verified private driving instructor',
    template: '%s | Drive Finder SG',
  },
  description:
    'Stop cold-calling 20 numbers. Tell us what you need and we will find you a vetted, high pass rate, available private driving instructor. $19 flat. No match, no charge.',
  applicationName: 'Drive Finder SG',
  keywords: [
    'private driving instructor Singapore',
    'PDI Singapore',
    'private driving lessons Singapore',
    'BBDC private instructor',
    'CDC private instructor',
    'SSDC private instructor',
    'Class 3 manual Singapore',
    'Class 3A auto Singapore',
    'driving instructor finder',
    'learn driving Singapore',
  ],
  authors: [{ name: 'Uniq Labs Pte Ltd', url: 'https://uqlabs.co' }],
  creator: 'Uniq Labs Pte Ltd',
  publisher: 'Uniq Labs Pte Ltd',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Drive Finder SG | Find a verified private driving instructor',
    description:
      'Tired of dead phone numbers? We personally verify availability with top-rated private driving instructors and hand you the ones who will actually teach you.',
    url: SITE_URL,
    siteName: 'Drive Finder SG',
    locale: 'en_SG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drive Finder SG | Find a verified private driving instructor',
    description:
      'We personally verify availability with top-rated private driving instructors in Singapore and hand you the ones who will actually teach you. $19 flat.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Drive Finder SG',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  image: `${SITE_URL}/opengraph-image`,
  description:
    'Concierge matching for Singapore private driving instructors. We verify availability with top-rated PDIs and send you the ones actually taking students.',
  priceRange: 'S$19',
  areaServed: { '@type': 'Country', name: 'Singapore' },
  parentOrganization: {
    '@type': 'Organization',
    name: 'Uniq Labs Pte Ltd',
    url: 'https://uqlabs.co',
  },
  offers: {
    '@type': 'Offer',
    price: '19',
    priceCurrency: 'SGD',
    description: 'Match with a verified private driving instructor at your chosen test centre.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <UniqHeader active="drivefinder" />
        {children}
        <Analytics />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
