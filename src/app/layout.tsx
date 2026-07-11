import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Servicios verificados cerca de ti`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['servicios Bolivia', 'plomeros', 'albañiles', 'electricistas', 'Santa Cruz', 'La Paz', 'Cochabamba'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'es_BO',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Servicios verificados cerca de ti`,
    description: SITE_DESCRIPTION,
    images: ['/images/laburopro-hero.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Servicios verificados cerca de ti`,
    description: SITE_DESCRIPTION,
    images: ['/images/laburopro-hero.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={manrope.variable}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
