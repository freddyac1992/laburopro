'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ProviderReportStatus } from '@/types/database'

export type AdminReport = {
  id: string
  provider_id: string | null
  reason: string
  details: string | null
  reporter_name: string | null
  reporter_contact: string | null
  status: ProviderReportStatus
  created_at: string
  updated_at: string
  provider: {
    display_name: string | null
    slug: string | null
    category: { name: string | null } | null
    city: { name: string | null } | null
  } | null
}

interface AdminReportActionsProps {
  initialReports: AdminReport[]
}

const STATUS_LABELS: Record<ProviderReportStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  resolved: 'Resuelto',
}

const REASON_LABELS: Record<string, string> = {
  no_responde: 'No responde o no atiende',
  datos_falsos: 'Datos falsos o incorrectos',
  mal_servicio: 'Mal servicio',
  cobro_indebido: 'Cobro indebido',
  comportamiento_inadecuado: 'Comportamiento inadecuado',
  otro: 'Otro motivo',
}

export default function AdminReportActions({ initialReports }: AdminReportActionsProps) {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState<ProviderReportStatus>('pending')
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = useMemo(
    () => reports.filter((report) => report.status === filter),
    [filter, reports]
  )

  async function updateReportStatus(id: string, status: ProviderReportStatus) {
    setSaving(id)
    setError(null)

    const { error: updateError } = await supabase
      .from('provider_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      setError(`No se pudo actualizar el reporte: ${updateError.message}`)
    } else {
      setReports((prev) =>
        prev.map((report) => (report.id === id ? { ...report, status } : report))
      )
    }

    setSaving(null)
  }

  const tabs = (['pending', 'reviewed', 'resolved'] as ProviderReportStatus[]).map((status) => ({
    id: status,
    label: STATUS_LABELS[status],
    count: reports.filter((report) => report.status === status).length,
  }))

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
              filter === tab.id
                ? 'border-teal-700 text-teal-800 bg-teal-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.id ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🛡️</div>
          <p>No hay reportes en este estado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-gray-900">
                      {report.provider?.display_name ?? 'Proveedor eliminado'}
                    </span>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {[report.provider?.category?.name, report.provider?.city?.name].filter(Boolean).join(' · ') || 'Sin categoría'}
                    {' · '}
                    {new Date(report.created_at).toLocaleDateString('es-BO')}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Reporta: {report.reporter_name ?? 'Anónimo'}
                    {report.reporter_contact ? ` · ${report.reporter_contact}` : ''}
                  </p>
                  {report.details && (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{report.details}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                  {report.provider?.slug && (
                    <Link
                      href={`/proveedores/${report.provider.slug}?preview=admin`}
                      target="_blank"
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      Ver perfil
                    </Link>
                  )}

                  {report.status !== 'reviewed' && (
                    <button
                      disabled={saving === report.id}
                      onClick={() => updateReportStatus(report.id, 'reviewed')}
                      className="text-xs px-3 py-1.5 border border-teal-200 text-teal-800 rounded-lg hover:bg-teal-50 disabled:opacity-60"
                    >
                      {saving === report.id ? '...' : 'Marcar revisado'}
                    </button>
                  )}

                  {report.status !== 'resolved' && (
                    <button
                      disabled={saving === report.id}
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving === report.id ? '...' : 'Resolver'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
