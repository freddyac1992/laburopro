'use client'

import { useMemo, useState } from 'react'
import type { LeadStatus } from '@/types/database'

export type DashboardLead = {
  id: string
  message: string | null
  source: string | null
  status: LeadStatus
  created_at: string
  updated_at: string
}

const STATUS_OPTIONS: Array<{
  value: LeadStatus
  label: string
  shortLabel: string
  badge: string
}> = [
  { value: 'new', label: 'Nuevo', shortLabel: 'Nuevos', badge: 'bg-blue-50 text-blue-700' },
  { value: 'contacted', label: 'Atendido', shortLabel: 'Atendidos', badge: 'bg-amber-50 text-amber-700' },
  { value: 'converted', label: 'Trabajo ganado', shortLabel: 'Ganados', badge: 'bg-green-50 text-green-700' },
  { value: 'lost', label: 'No concretado', shortLabel: 'No concretados', badge: 'bg-gray-100 text-gray-600' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(value))
}

function getWaitingLabel(value: string, referenceTime: number) {
  const hours = Math.max(0, Math.floor((referenceTime - new Date(value).getTime()) / 3_600_000))
  if (hours < 1) return 'Recibido hace menos de una hora'
  if (hours < 24) return `Sin atender hace ${hours} hora${hours === 1 ? '' : 's'}`
  const days = Math.floor(hours / 24)
  return `Sin atender hace ${days} día${days === 1 ? '' : 's'}`
}

export default function LeadPipeline({
  initialLeads,
  initialFilter = 'all',
  referenceTime,
}: {
  initialLeads: DashboardLead[]
  initialFilter?: LeadStatus | 'all'
  referenceTime: string
}) {
  const [leads, setLeads] = useState(initialLeads)
  const [filter, setFilter] = useState<LeadStatus | 'all'>(initialFilter)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const referenceTimeMs = new Date(referenceTime).getTime()

  const filteredLeads = useMemo(
    () => (filter === 'all' ? leads : leads.filter((lead) => lead.status === filter)).toSorted((a, b) => {
      if (a.status === 'new' && b.status !== 'new') return -1
      if (a.status !== 'new' && b.status === 'new') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }),
    [filter, leads]
  )

  async function updateStatus(id: string, status: LeadStatus) {
    setSaving(id)
    setError(null)

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json() as { message?: string; lead?: { updated_at: string } }

      if (!response.ok) throw new Error(result.message ?? 'No se pudo actualizar el contacto.')

      setLeads((current) => current.map((lead) => (
        lead.id === id
          ? { ...lead, status, updated_at: result.lead?.updated_at ?? new Date().toISOString() }
          : lead
      )))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el contacto.')
    } finally {
      setSaving(null)
    }
  }

  const converted = leads.filter((lead) => lead.status === 'converted').length
  const resolved = leads.filter((lead) => lead.status === 'converted' || lead.status === 'lost').length
  const closeRate = resolved > 0 ? Math.round((converted / resolved) * 100) : 0

  const filters = [
    { value: 'all' as const, label: 'Todos', count: leads.length },
    ...STATUS_OPTIONS.map((option) => ({
      value: option.value,
      label: option.shortLabel,
      count: leads.filter((lead) => lead.status === option.value).length,
    })),
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">{option.shortLabel}</div>
            <div className="text-2xl font-bold text-gray-900">
              {leads.filter((lead) => lead.status === option.value).length}
            </div>
          </div>
        ))}
        <div className="bg-white border border-gray-100 rounded-lg p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-gray-500 mb-1">Tasa de cierre</div>
          <div className="text-2xl font-bold text-green-700">{closeRate}%</div>
        </div>
      </div>

      {error && (
        <div role="alert" className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex min-w-max" role="tablist" aria-label="Filtrar contactos">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                filter === item.value
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {item.label} <span className="ml-1 text-xs">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filteredLeads.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {filteredLeads.map((lead) => {
            const currentStatus = STATUS_OPTIONS.find((option) => option.value === lead.status)!
            return (
              <article key={lead.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900">Contacto por WhatsApp</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.badge}`}>
                        {currentStatus.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(lead.created_at)} · {lead.source ?? 'whatsapp'}</p>
                    {lead.status === 'new' && (
                      <p className={`mt-1 text-xs font-semibold ${
                        referenceTimeMs - new Date(lead.created_at).getTime() >= 86_400_000
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}>
                        {getWaitingLabel(lead.created_at, referenceTimeMs)}
                      </p>
                    )}
                    {lead.message && (
                      <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{lead.message}</p>
                    )}
                  </div>

                  <label className="text-xs font-medium text-gray-600 lg:w-44">
                    Estado
                    <select
                      value={lead.status}
                      disabled={saving === lead.id}
                      onChange={(event) => updateStatus(lead.id, event.target.value as LeadStatus)}
                      className="mt-1 w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-900 disabled:opacity-60"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-gray-500">
          No hay contactos en este estado.
        </div>
      )}
    </div>
  )
}
