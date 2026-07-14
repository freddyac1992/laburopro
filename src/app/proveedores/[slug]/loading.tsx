export default function ProviderLoading() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10" aria-live="polite">
      <div className="h-8 w-64 rounded bg-slate-200 animate-pulse" />
      <p className="mt-4 text-base font-semibold text-slate-600">Abriendo la información del trabajador...</p>
      <div className="mt-8 h-80 rounded-lg border border-slate-200 bg-white animate-pulse" aria-hidden="true" />
    </main>
  )
}
