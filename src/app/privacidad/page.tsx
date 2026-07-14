import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Política de Privacidad — ${SITE_NAME}`,
  robots: { index: false },
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
      <div className="prose prose-gray max-w-none text-gray-700 space-y-6">
        <p className="text-gray-500 text-sm">Última actualización: julio 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información que recopilamos</h2>
          <p>
            LaburoPro recopila información que los proveedores ingresan voluntariamente al crear su perfil,
            incluyendo nombre, ciudad, descripción de servicios y número de WhatsApp de contacto.
            También recopilamos información de uso del sitio a través de herramientas de análisis.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Uso de la información</h2>
          <p>
            La información de los proveedores se publica en el directorio público para facilitar el contacto
            con clientes potenciales. No vendemos ni compartimos información personal con terceros
            sin consentimiento expreso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Seguridad</h2>
          <p>
            Utilizamos Supabase como plataforma de base de datos con Row Level Security habilitado.
            El acceso se realiza con Google y la sesión es gestionada de forma segura a través de Supabase Auth. LaburoPro no recibe ni almacena tu contraseña de Google.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Contacto</h2>
          <p>
            Para consultas sobre privacidad, contáctanos en: laburo.pro.bolivia@gmail.com
          </p>
        </section>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Esta es una política de privacidad preliminar. Será actualizada con el asesoramiento legal
          correspondiente antes del lanzamiento oficial.
        </div>
      </div>
    </div>
  )
}
