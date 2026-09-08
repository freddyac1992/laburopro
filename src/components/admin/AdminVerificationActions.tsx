'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, ExternalLink, FileImage, ShieldOff, XCircle } from 'lucide-react'
import type { AdminVerificationRequest } from '@/app/admin/verificaciones/page'
import type { VerificationStatus } from '@/types/database'
import { requestJson, requestErrorMessage } from '@/lib/request-json'

type Filter = 'pending' | 'approved' | 'rejected' | 'revoked' | 'all'

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  revoked: 'Retirada',
}

const STATUS_STYLES: Record<VerificationStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  revoked: 'bg-slate-100 text-slate-700',
}

export default function AdminVerificationActions({ initialRequests }: { readonly initialRequests: AdminVerificationRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<Filter>('pending')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const visible = requests.filter((request) => filter === 'all' || request.status === filter)
  const tabs: { value: Filter; label: string }[] = [
    { value: 'pending', label: 'Por revisar' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'revoked', label: 'Retiradas' },
    { value: 'all', label: 'Todas' },
  ]

  async function review(id: string, decision: 'approved' | 'rejected' | 'revoked') {
    setError(null)
    const reason = reasons[id]?.trim() ?? ''
    if ((decision === 'rejected' || decision === 'revoked') && reason.length < 5) {
      setError('Escribe un motivo claro antes de guardar la decisión.')
      return
    }
    if (decision === 'revoked' && !window.confirm('¿Retirar esta verificación? La insignia desaparecerá del perfil.')) return
    setSaving(id)
    try {
      const result = await requestJson<{ documentsDeleted?: boolean }>(`/api/admin/verification-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      }, 'No pudimos guardar la decisión. Inténtalo más tarde.')
      setRequests((current) => current.map((item) => item.id === id ? {
        ...item,
        status: decision,
        review_note: decision === 'rejected' || decision === 'revoked' ? reason : null,
        reviewed_at: new Date().toISOString(),
        document_front_path: null,
        document_back_path: null,
        provider: item.provider ? { ...item.provider, is_verified: decision === 'approved' } : null,
      } : item))
      if (result.documentsDeleted === false) setError('La decisión se guardó, pero revisa manualmente la limpieza de los archivos privados.')
    } catch (reviewError) {
      setError(requestErrorMessage(reviewError, 'No pudimos guardar la decisión. Inténtalo más tarde.'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Filtrar verificaciones">
        {tabs.map((tab) => {
          const count = tab.value === 'all' ? requests.length : requests.filter((item) => item.status === tab.value).length
          return <button key={tab.value} type="button" role="tab" aria-selected={filter === tab.value} onClick={() => setFilter(tab.value)} className={`min-h-12 shrink-0 border-b-2 px-4 text-sm font-bold ${filter === tab.value ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500'}`}>{tab.label} ({count})</button>
        })}
      </div>

      {visible.length === 0 ? (
        <div className="border-y border-slate-200 py-10 text-center text-slate-500">No hay solicitudes en este estado.</div>
      ) : (
        <div className="space-y-4">
          {visible.map((request) => (
            <article key={request.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#102a33]">{request.legal_name}</h2>
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${STATUS_STYLES[request.status]}`}>{STATUS_LABELS[request.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Perfil: {request.provider?.display_name ?? 'No disponible'} · {request.profile?.email ?? 'Sin correo'}</p>
                  <p className="mt-1 text-xs text-slate-500">Documento: {request.document_type === 'ci' ? 'Carnet de identidad' : 'Pasaporte'} · Enviado: {new Date(request.submitted_at).toLocaleDateString('es-BO')}</p>
                  {request.review_note && <p className="mt-3 text-sm text-slate-700"><strong>Motivo:</strong> {request.review_note}</p>}
                </div>
                <Link href={request.provider ? `/proveedores/${request.provider.slug}?preview=admin` : '#'} target="_blank" className="inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700"><ExternalLink className="h-4 w-4" aria-hidden="true" />Ver perfil</Link>
              </div>

              {request.status === 'pending' && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="flex flex-wrap gap-3">
                    <a href={`/api/admin/verification-requests/${request.id}/document?side=front`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-teal-300 px-4 font-bold text-teal-800"><FileImage className="h-5 w-5" aria-hidden="true" />Abrir frente</a>
                    {request.document_back_path && <a href={`/api/admin/verification-requests/${request.id}/document?side=back`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-teal-300 px-4 font-bold text-teal-800"><FileImage className="h-5 w-5" aria-hidden="true" />Abrir reverso</a>}
                  </div>
                  <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor={`reason-${request.id}`}>Motivo si rechazas
                    <textarea id={`reason-${request.id}`} value={reasons[request.id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={300} rows={2} className="form-input mt-2 resize-none" placeholder="Ejemplo: La fotografía está borrosa y no permite leer el nombre." />
                  </label>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button type="button" disabled={saving === request.id} onClick={() => review(request.id, 'approved')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-green-700 px-5 font-bold text-white hover:bg-green-800 disabled:opacity-60"><BadgeCheck className="h-5 w-5" aria-hidden="true" />{saving === request.id ? 'Guardando...' : 'Aprobar identidad'}</button>
                    <button type="button" disabled={saving === request.id} onClick={() => review(request.id, 'rejected')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-red-300 px-5 font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"><XCircle className="h-5 w-5" aria-hidden="true" />{saving === request.id ? 'Guardando...' : 'Rechazar'}</button>
                  </div>
                </div>
              )}

              {request.status === 'approved' && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <label className="block text-sm font-bold text-slate-700" htmlFor={`reason-${request.id}`}>Motivo para retirar la verificación
                    <textarea id={`reason-${request.id}`} value={reasons[request.id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={300} rows={2} className="form-input mt-2 resize-none" placeholder="Ejemplo: La identidad requiere una nueva revisión por información inconsistente." />
                  </label>
                  <button type="button" disabled={saving === request.id} onClick={() => review(request.id, 'revoked')} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><ShieldOff className="h-5 w-5" aria-hidden="true" />{saving === request.id ? 'Guardando...' : 'Retirar verificación'}</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
