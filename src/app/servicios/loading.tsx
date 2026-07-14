export default function ServicesLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-live="polite">
      <div className="max-w-xl">
        <div className="h-8 w-64 rounded bg-slate-200 animate-pulse" />
        <p className="mt-4 text-base font-semibold text-slate-600">Buscando trabajadores, espera un momento...</p>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-52 rounded-lg border border-slate-200 bg-white animate-pulse" />)}
      </div>
    </main>
  )
}
