import Link from 'next/link'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#102a33] text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-3">
              <span className="bg-teal-500 text-white px-2 py-1 rounded-md text-sm font-extrabold">LP</span>
              {SITE_NAME}
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {SITE_TAGLINE}. Conectamos bolivianos con proveedores de servicios verificados en todo el país.
            </p>
            <p className="mt-4 text-gray-500 text-xs">
              🇧🇴 Hecho con orgullo en Bolivia
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm">Servicios</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/servicios/albaniles" className="hover:text-white transition-colors">Albañiles</Link></li>
              <li><Link href="/servicios/plomeros" className="hover:text-white transition-colors">Plomeros</Link></li>
              <li><Link href="/servicios/electricistas" className="hover:text-white transition-colors">Electricistas</Link></li>
              <li><Link href="/servicios/fletes-y-mudanzas" className="hover:text-white transition-colors">Fletes y Mudanzas</Link></li>
              <li><Link href="/servicios" className="hover:text-white transition-colors text-teal-300">Ver todos →</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 text-sm">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/registro" className="hover:text-white transition-colors">Publicar mi servicio</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Ingresar</Link></li>
              <li><Link href="/#como-funciona" className="hover:text-white transition-colors">Cómo funciona</Link></li>
              <li><Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
              <li><Link href="/terminos" className="hover:text-white transition-colors">Términos</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © {currentYear} {SITE_NAME}. Todos los derechos reservados.
          </p>
          <p className="text-gray-600 text-xs">
            laburopro.com — Bolivia
          </p>
        </div>
      </div>
    </footer>
  )
}
