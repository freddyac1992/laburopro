'use client'

import { useState } from 'react'

interface ProviderReportFormProps {
  providerId: string
  providerName: string
}

const REASONS = [
  { value: 'no_responde', label: 'No responde o no atiende' },
  { value: 'datos_falsos', label: 'Datos falsos o incorrectos' },
  { value: 'mal_servicio', label: 'Mal servicio' },
  { value: 'cobro_indebido', label: 'Cobro indebido' },
  { value: 'comportamiento_inadecuado', label: 'Comportamiento inadecuado' },
  { value: 'otro', label: 'Otro motivo' },
]

export default function ProviderReportForm({ providerId, providerName }: ProviderReportFormProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterContact, setReporterContact] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setError(null)

    const response = await fetch('/api/provider-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        reason,
        details,
        reporterName,
        reporterContact,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as { message?: string }

    if (!response.ok) {
      setError(payload.message ?? 'No se pudo enviar el reporte.')
      setStatus('idle')
      return
    }

    setStatus('success')
    setReason('')
    setDetails('')
    setReporterName('')
    setReporterContact('')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="w-full text-left flex items-center justify-between gap-3"
      >
        <span>
          <span className="block font-semibold text-gray-900">Reportar perfil</span>
          <span className="block text-sm text-gray-500">Avísanos si algo no parece correcto.</span>
        </span>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm mb-4">
              Gracias. Revisaremos el reporte de {providerName}.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
                Motivo
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                className="form-input bg-white text-gray-900 cursor-pointer"
              >
                <option value="">Seleccionar motivo</option>
                {REASONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-details" className="block text-sm font-medium text-gray-700 mb-1.5">
                Detalles
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                required
                minLength={10}
                maxLength={900}
                rows={4}
                placeholder="Describe qué ocurrió o qué dato debemos revisar"
                className="form-input bg-white text-gray-900 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reporter-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tu nombre
                </label>
                <input
                  id="reporter-name"
                  value={reporterName}
                  onChange={(event) => setReporterName(event.target.value)}
                  placeholder="Opcional"
                  maxLength={80}
                  className="form-input bg-white text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="reporter-contact" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contacto
                </label>
                <input
                  id="reporter-contact"
                  value={reporterContact}
                  onChange={(event) => setReporterContact(event.target.value)}
                  placeholder="Opcional"
                  maxLength={120}
                  className="form-input bg-white text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full px-5 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {status === 'saving' ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
