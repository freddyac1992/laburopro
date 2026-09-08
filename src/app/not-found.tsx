import Link from 'next/link'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-5 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-[#102a33]">No encontramos esta página</h1>
      <p className="mt-3 text-slate-600">El enlace puede estar incompleto o el perfil ya no estar disponible. Puedes buscar otro trabajador por oficio y ciudad.</p>
      <Link href="/servicios" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-md bg-teal-700 px-5 font-bold text-white"><Search className="h-5 w-5" aria-hidden="true" />Buscar trabajador</Link>
    </section>
  )
}
