import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Proveedores guardados',
  description: 'Tu lista personal de proveedores guardados en LaburoPro.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SavedProvidersLayout({ children }: { children: React.ReactNode }) {
  return children
}
