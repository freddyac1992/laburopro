'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, MessageCircle, RotateCcw } from 'lucide-react'
import { getActivity, type ActivityPeriod, type DashboardMetrics } from '@/lib/dashboard'

export default function DashboardActivity({ metrics }: Readonly<{ metrics: DashboardMetrics | null }>) {
  const [period, setPeriod] = useState<ActivityPeriod>('week')
  const router = useRouter()
  const [refreshing, startTransition] = useTransition()
  if (!metrics) return <section className="py-6" role="status">
    <h2 className="font-bold">No pudimos cargar tu actividad</h2>
    <p className="mt-2 text-sm text-gray-600">Tu perfil sigue guardado. Vuelve a cargar para consultar las cifras.</p>
    <button type="button" disabled={refreshing} onClick={() => startTransition(() => router.refresh())} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-teal-800 disabled:opacity-60"><RotateCcw size={17} aria-hidden="true" />{refreshing ? 'Cargando…' : 'Volver a cargar'}</button>
  </section>
  const activity = getActivity(metrics, period)
  return (
    <section className="py-6" aria-labelledby="dashboard-activity-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dashboard-activity-title" className="font-bold">Actividad de tu perfil</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">Período
          <select value={period} onChange={(event) => setPeriod(event.target.value as ActivityPeriod)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-gray-900">
            <option value="today">Hoy</option><option value="week">Últimos 7 días</option><option value="month">Últimos 30 días</option><option value="all">Todo el tiempo</option>
          </select>
        </label>
      </div>
      <dl className="my-5 grid grid-cols-2 divide-x divide-gray-200" aria-live="polite" aria-atomic="true">
        <div className="pr-4"><dt className="flex items-center gap-2 text-sm text-gray-600"><Eye size={17} aria-hidden="true" />Visitas al perfil</dt><dd className="mt-2 text-3xl font-bold tabular-nums">{activity.views}</dd></div>
        <div className="pl-4"><dt className="flex items-center gap-2 text-sm text-gray-600"><MessageCircle size={17} aria-hidden="true" />Clics en WhatsApp</dt><dd className="mt-2 text-3xl font-bold tabular-nums">{activity.contacts}</dd></div>
      </dl>
      <p className="text-sm text-gray-600">{activity.views === 0 && activity.contacts === 0 ? 'Todavía no hay actividad registrada en este período. ' : ''}Los clics no confirman mensajes enviados ni trabajos contratados. Una persona puede generar varias visitas.</p>
    </section>
  )
}
