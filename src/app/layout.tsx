import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Drive Finder SG | Find a verified private driving instructor',
  description:
    'Stop cold-calling 20 numbers. Tell us what you need and we will find you 2 to 3 vetted, high pass rate, available private driving instructors. $19 flat. No match, no charge.',
  openGraph: {
    title: 'Drive Finder SG | Private instructor match',
    description:
      'Tired of dead phone numbers? We personally verify availability with top-rated private driving instructors and hand you the ones who will actually teach you.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
