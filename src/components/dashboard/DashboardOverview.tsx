import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Circle, Clock3, Eye, MessageCircle, Pencil, Plus, ShieldCheck, Star, UserRound } from 'lucide-react'
import DashboardShell from '@/components/dashboard/DashboardShell'
import DashboardActivity from '@/components/dashboard/DashboardActivity'
import ProfileShareButton from '@/components/dashboard/ProfileShareButton'
import { getProfileChecklist, getPublicationState, type DashboardMetrics, type ProviderDashboardProfile } from '@/lib/dashboard'
import { getProviderImageUrl } from '@/lib/provider-images'

export type { DashboardMetrics, ProviderDashboardProfile } from '@/lib/dashboard'

const primaryAction = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800'
const secondaryAction = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50'

function FirstProfile() {
  return (
    <section className="border-y border-gray-200 py-8">
      <h2 className="text-xl font-bold">Tu trabajo empieza con un perfil</h2>
      <p className="mt-2 max-w-xl text-gray-600">Añade qué haces, dónde trabajas y tu WhatsApp. Puedes guardar tu información y mejorarla después.</p>
      <ol className="my-6 grid gap-4 sm:grid-cols-3">
        {['Completa tus datos', 'Envíalos a revisión', 'Recibe contactos por WhatsApp'].map((label, index) => (
          <li key={label} className="flex items-center gap-3 text-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-800">{index + 1}</span>{label}</li>
        ))}
      </ol>
      <Link href="/dashboard/perfil" id="dashboard-create-profile-btn" className={primaryAction}><Plus size={18} aria-hidden="true" />Crear mi perfil de trabajo</Link>
    </section>
  )
}

function ProfileHeader({ provider }: Readonly<{ provider: ProviderDashboardProfile }>) {
  const state = getPublicationState(provider)
  const photo = getProviderImageUrl(provider.profile_photo_path)
  return (
    <section className="border-y border-gray-200 py-6">
      <div className="flex items-start gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-500">
          {photo ? <Image src={photo} alt={`Foto de ${provider.display_name}`} fill sizes="80px" className="object-cover" unoptimized /> : <UserRound size={32} aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-bold">{provider.display_name}</h2>
          <p className="mt-1 text-sm text-gray-600">{provider.category?.name ?? 'Sin categoría'} · {provider.city?.name ?? 'Sin ciudad'}</p>
          <p className={`mt-2 flex items-center gap-2 text-sm font-bold ${state.isPublic ? 'text-teal-800' : 'text-amber-800'}`}>
            {state.isPublic ? <Eye size={16} aria-hidden="true" /> : <Clock3 size={16} aria-hidden="true" />}{state.label}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">{state.description}</p>
      <div className="mt-5 flex flex-wrap items-start gap-3">
        <Link href="/dashboard/perfil" id="dashboard-edit-profile-card" className={secondaryAction}><Pencil size={17} aria-hidden="true" />Editar mi perfil</Link>
        {state.isPublic && <>
          <Link href={`/proveedores/${provider.slug}`} id="dashboard-view-profile-link" className={secondaryAction}><Eye size={17} aria-hidden="true" />Ver mi perfil público</Link>
          <ProfileShareButton slug={provider.slug} name={provider.display_name} />
        </>}
      </div>
    </section>
  )
}

function NextStep({ provider, metrics }: Readonly<{ provider: ProviderDashboardProfile; metrics: DashboardMetrics | null }>) {
  const missing = getProfileChecklist(provider).find((item) => !item.done)
  const hasContacts = Boolean(metrics && metrics.newLeadCount > 0)
  const title = hasContacts ? 'Revisa tus contactos nuevos' : 'Mejora tu perfil, paso a paso'
  const detail = hasContacts
    ? `${metrics!.newLeadCount} ${metrics!.newLeadCount === 1 ? 'contacto sin seguimiento' : 'contactos sin seguimiento'}.${metrics!.staleLeadCount > 0 ? ` Sin actualizar desde hace más de 24 horas: ${metrics!.staleLeadCount}.` : ''}`
    : `Siguiente dato recomendado: ${missing?.label.toLocaleLowerCase('es')}.`
  if (!hasContacts && !missing) return null
  return (
    <section className="flex flex-col gap-4 border-b border-gray-200 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm text-gray-600">{detail}</p></div>
      <Link href={hasContacts ? '/dashboard/contactos?filter=new' : '/dashboard/perfil'} className={`${primaryAction} shrink-0`}>
        {hasContacts ? 'Revisar contactos' : 'Completar información'}<ArrowRight size={17} aria-hidden="true" />
      </Link>
    </section>
  )
}

function ProfileDetails({ provider }: Readonly<{ provider: ProviderDashboardProfile }>) {
  const checklist = getProfileChecklist(provider)
  const completed = checklist.filter((item) => item.done).length
  return (
    <div className="grid gap-8 border-t border-gray-200 py-6 lg:grid-cols-2">
      <section>
        <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Tu información</h2><span className="text-sm text-gray-600">{completed} de {checklist.length}</span></div>
        <progress value={completed} max={checklist.length} aria-label="Información completada" className="dashboard-progress my-4 h-2 w-full" />
        <ul className="space-y-3">
          {checklist.map((item) => <li key={item.label} className="flex items-start gap-2 text-sm">
            {item.done ? <Check size={18} className="shrink-0 text-teal-700" aria-label="Completo" /> : <Circle size={18} className="shrink-0 text-gray-400" aria-label="Pendiente" />}
            <span className={item.done ? 'text-gray-600' : 'font-semibold text-gray-900'}>{item.label}</span>
          </li>)}
        </ul>
      </section>
      <section className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><ShieldCheck size={20} className="text-teal-700" aria-hidden="true" />Tu identidad</h2>
          <p className="mt-2 text-sm text-gray-600">{provider.is_verified ? 'Identidad confirmada por LaburoPro.' : 'Tu identidad todavía no está confirmada. Esto es distinto de la aprobación de tu perfil.'}</p>
          {!provider.is_verified && <Link href="/dashboard/verificacion" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-teal-800 hover:underline">Ver estado de verificación<ArrowRight size={16} aria-hidden="true" /></Link>}
        </div>
        <div className="border-t border-gray-200 pt-5">
          <h2 className="flex items-center gap-2 font-bold"><Star size={20} className="text-amber-600" aria-hidden="true" />Opiniones de clientes</h2>
          <p className="mt-2 text-sm text-gray-600">{provider.review_count > 0 ? `${provider.rating.toFixed(1)} de 5 · ${provider.review_count} ${provider.review_count === 1 ? 'reseña publicada' : 'reseñas publicadas'}` : 'Todavía no tienes reseñas publicadas.'}</p>
          {getPublicationState(provider).isPublic && <p className="mt-2 text-sm text-gray-600">Comparte tu perfil con quienes ya contrataron tu trabajo para que puedan dejar su opinión.</p>}
        </div>
      </section>
    </div>
  )
}

export default function DashboardOverview({ name, provider, metrics }: Readonly<{ name: string; provider: ProviderDashboardProfile | null; metrics: DashboardMetrics | null }>) {
  return (
    <DashboardShell title={`Hola, ${name}`} newLeadCount={metrics?.newLeadCount ?? 0}>
      {!provider ? <FirstProfile /> : <>
        <ProfileHeader provider={provider} />
        <NextStep provider={provider} metrics={metrics} />
        <DashboardActivity metrics={metrics} />
        <Link href="/dashboard/contactos" id="dashboard-contacts-card" className="flex min-h-14 items-center justify-between gap-3 border-t border-gray-200 py-4 font-bold text-teal-800 hover:text-teal-950">
          <span className="flex items-center gap-2"><MessageCircle size={20} aria-hidden="true" />Ver todos mis contactos</span><ArrowRight size={18} aria-hidden="true" />
        </Link>
        <ProfileDetails provider={provider} />
      </>}
    </DashboardShell>
  )
}
