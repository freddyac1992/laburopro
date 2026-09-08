'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Camera, Clock3, FileCheck2, LockKeyhole, ShieldCheck, XCircle } from 'lucide-react'
import { compressProviderImage } from '@/lib/provider-images'
import type { VerificationDocumentType, VerificationRequest, VerificationStatus } from '@/types/database'

type Props = {
  readonly hasProfile: boolean
  readonly isVerified: boolean
  readonly initialRequest: VerificationRequest | null
}

function StatusPanel({ status, reason }: { readonly status: VerificationStatus; readonly reason?: string | null }) {
  if (status === 'approved') {
    return (
      <section className="rounded-lg border border-green-200 bg-green-50 p-5 text-green-950">
        <div className="flex gap-3">
          <BadgeCheck className="h-7 w-7 shrink-0 text-green-700" aria-hidden="true" />
          <div><h2 className="font-extrabold">Tu identidad está confirmada</h2><p className="mt-1 text-sm leading-relaxed">La insignia ya aparece en tu perfil público.</p></div>
        </div>
      </section>
    )
  }
  if (status === 'pending') {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="flex gap-3">
          <Clock3 className="h-7 w-7 shrink-0 text-amber-700" aria-hidden="true" />
          <div><h2 className="font-extrabold">Estamos revisando tus documentos</h2><p className="mt-1 text-sm leading-relaxed">No necesitas enviarlos otra vez. Verás el resultado en esta página.</p></div>
        </div>
      </section>
    )
  }
  const revoked = status === 'revoked'
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-950">
      <div className="flex gap-3">
        <XCircle className="h-7 w-7 shrink-0 text-red-700" aria-hidden="true" />
        <div><h2 className="font-extrabold">{revoked ? 'Tu verificación fue retirada' : 'Necesitamos que vuelvas a enviar tus documentos'}</h2><p className="mt-1 text-sm leading-relaxed">Motivo: {reason ?? 'Contacta a LaburoPro si necesitas más información.'}</p></div>
      </div>
    </section>
  )
}

export default function VerificationRequestForm({ hasProfile, isVerified, initialRequest }: Props) {
  const [legalName, setLegalName] = useState(initialRequest?.legal_name ?? '')
  const [documentType, setDocumentType] = useState<VerificationDocumentType>(initialRequest?.document_type ?? 'ci')
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<VerificationStatus | null>(isVerified ? 'approved' : initialRequest?.status ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!hasProfile) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <FileCheck2 className="mx-auto h-10 w-10 text-teal-700" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-extrabold text-[#102a33]">Primero crea tu perfil de trabajo</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Necesitamos saber qué servicio ofreces antes de confirmar tu identidad.</p>
        <Link href="/dashboard/perfil" className="mt-5 inline-flex min-h-12 items-center rounded-md bg-teal-700 px-6 font-bold text-white hover:bg-teal-800">Crear mi perfil</Link>
      </section>
    )
  }

  if (status === 'approved' || status === 'pending') return <StatusPanel status={status} />

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (legalName.trim().length < 2) return setError('Escribe tu nombre completo como aparece en el documento.')
    if (!front) return setError('Toma una foto del frente del documento.')
    if (documentType === 'ci' && !back) return setError('Toma una foto del reverso de tu carnet de identidad.')
    if (!consent) return setError('Marca la casilla para autorizar la revisión.')

    setSaving(true)
    try {
      const [frontImage, backImage] = await Promise.all([
        compressProviderImage(front, { width: 1800, height: 1200 }),
        back ? compressProviderImage(back, { width: 1800, height: 1200 }) : Promise.resolve(null),
      ])
      const data = new FormData()
      data.set('legal_name', legalName.trim())
      data.set('document_type', documentType)
      data.set('consent', 'true')
      data.set('front', frontImage, 'front.webp')
      if (backImage) data.set('back', backImage, 'back.webp')

      const response = await fetch('/api/verification-request', { method: 'POST', body: data })
      const result = await response.json() as { message?: string; status?: VerificationStatus }
      if (!response.ok) throw new Error(result.message ?? 'No pudimos enviar la solicitud.')
      setStatus('pending')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'No pudimos enviar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {(status === 'rejected' || status === 'revoked') && <StatusPanel status={status} reason={initialRequest?.review_note} />}

      <section className="border-l-4 border-teal-700 bg-teal-50 px-4 py-4 text-sm text-teal-950">
        <div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0" aria-hidden="true" /><div><h2 className="font-extrabold">¿Para qué sirve?</h2><p className="mt-1 leading-relaxed">Confirmamos que eres una persona real. Al aprobarte, mostraremos la insignia “Identidad confirmada” en tu perfil.</p></div></div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 font-semibold text-red-800">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        <section className="wizard-panel">
          <div><h2 className="wizard-title">1. Tus datos</h2><p className="wizard-help">Deben coincidir con el documento que enviarás.</p></div>
          <label className="wizard-label" htmlFor="verification-legal-name">Nombre y apellidos completos
            <input id="verification-legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} className="form-input mt-2" autoComplete="name" maxLength={120} placeholder="Ejemplo: Juan Carlos Pérez Flores" />
          </label>
          <fieldset><legend className="wizard-label">Tipo de documento</legend>
            <div className="mt-2 grid grid-cols-2 rounded-md border border-slate-300 bg-slate-100 p-1">
              {([['ci', 'Carnet de identidad'], ['passport', 'Pasaporte']] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={documentType === value} onClick={() => { setDocumentType(value); if (value === 'passport') setBack(null) }} className={`min-h-12 rounded-md px-3 text-sm font-bold ${documentType === value ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'}`}>{label}</button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="wizard-panel">
          <div><h2 className="wizard-title">2. Fotografía tu documento</h2><p className="wizard-help">Colócalo sobre una mesa, con buena luz y sin tapar ningún dato.</p></div>
          <DocumentInput id="verification-front" label={documentType === 'ci' ? 'Frente del carnet' : 'Página con tu fotografía'} file={front} onChange={setFront} />
          {documentType === 'ci' && <DocumentInput id="verification-back" label="Reverso del carnet" file={back} onChange={setBack} />}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex gap-3"><LockKeyhole className="h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" /><div><h2 className="font-extrabold text-[#102a33]">Tus documentos son privados</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">Solo un administrador puede abrirlos mediante un enlace temporal. Eliminaremos las imágenes después de aprobar o rechazar la solicitud.</p></div></div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-700"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-teal-700" /><span>Autorizo a LaburoPro a revisar temporalmente estas imágenes para confirmar mi identidad. Leí la <Link href="/privacidad" target="_blank" className="font-bold text-teal-700 underline">política de privacidad</Link>.</span></label>
        </section>

        <button type="submit" disabled={saving} id="verification-submit" className="min-h-14 w-full rounded-md bg-[#e85d3f] px-6 font-extrabold text-white hover:bg-[#cf4f34] disabled:opacity-60">{saving ? 'Protegiendo y enviando...' : 'Enviar para revisión'}</button>
      </form>
    </div>
  )
}

function DocumentInput({ id, label, file, onChange }: { readonly id: string; readonly label: string; readonly file: File | null; readonly onChange: (file: File | null) => void }) {
  return (
    <label htmlFor={id} className="block rounded-lg border border-slate-200 p-4">
      <span className="flex items-center gap-2 font-bold text-[#102a33]"><Camera className="h-5 w-5 text-teal-700" aria-hidden="true" />{label}</span>
      <span className="mt-1 block text-sm text-slate-500">{file ? `Lista: ${file.name}` : 'Toca aquí para usar la cámara o elegir una foto'}</span>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => onChange(event.target.files?.[0] ?? null)} className="easy-file-input mt-3 block w-full text-sm text-slate-700" />
    </label>
  )
}
