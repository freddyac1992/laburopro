import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Términos y Condiciones — ${SITE_NAME}`,
  robots: { index: false },
}

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones</h1>
      <div className="text-gray-700 space-y-6">
        <p className="text-gray-500 text-sm">Última actualización: julio 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de términos</h2>
          <p>
            Al usar LaburoPro, aceptas estos términos. Si no estás de acuerdo, no uses la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Rol de la plataforma</h2>
          <p>
            LaburoPro es un directorio de proveedores de servicios. No somos parte en los contratos
            entre proveedores y clientes, y no garantizamos la calidad ni resultado de ningún servicio.
            Realizamos una revisión básica de identidad de los proveedores, pero la responsabilidad
            final recae en el cliente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Responsabilidades del proveedor</h2>
          <p>
            Los proveedores son responsables de la veracidad de la información publicada en sus perfiles.
            Información falsa o engañosa resultará en la eliminación del perfil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Limitación de responsabilidad</h2>
          <p>
            LaburoPro no se hace responsable por daños, pérdidas o conflictos derivados del uso
            de los servicios listados en la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios se comunicarán a través del sitio web.
          </p>
        </section>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Estos son términos preliminares. Serán revisados por asesores legales antes del lanzamiento oficial.
        </div>
      </div>
    </div>
  )
}
