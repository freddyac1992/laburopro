'use client'

import Link from 'next/link'
import { RotateCcw, Search } from 'lucide-react'

export default function ErrorPage({ retry }: { readonly error: Error & { digest?: string }; readonly retry: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-5 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-[#102a33]">No pudimos cargar esta página</h1>
      <p role="alert" className="mt-3 text-slate-600">Puede ser un problema temporal. Intenta cargarla de nuevo o vuelve a buscar un trabajador.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={retry} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-teal-700 px-5 font-bold text-white"><RotateCcw className="h-5 w-5" aria-hidden="true" />Volver a intentar</button>
        <Link href="/servicios" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-teal-700 px-5 font-bold text-teal-800"><Search className="h-5 w-5" aria-hidden="true" />Buscar trabajador</Link>
      </div>
    </section>
  )
}
