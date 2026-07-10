'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Provider {
  id: string
  display_name: string
  slug: string
  is_approved: boolean
  is_verified: boolean
  is_active: boolean
  created_at: string
  whatsapp: string | null
  category: { name: string } | null
  city: { name: string } | null
  profile: { email: string | null; full_name: string | null } | null
}

interface Props {
  initialProviders: Provider[]
}

type FilterTab = 'all' | 'pending' | 'approved' | 'verified'

export default function AdminProviderActions({ initialProviders }: Props) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')

  const supabase = createClient()

  async function updateProvider(id: string, updates: Partial<{ is_approved: boolean; is_verified: boolean; is_active: boolean }>) {
    setSaving(id)
    setError(null)
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      setError(`No se pudo actualizar el proveedor: ${updateError.message}`)
    } else {
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      )
    }
    setSaving(null)
  }

  const filtered = providers.filter((p) => {
    if (filter === 'pending') return !p.is_approved && p.is_active
    if (filter === 'approved') return p.is_approved && !p.is_verified
    if (filter === 'verified') return p.is_verified
    return true
  })

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: providers.length },
    { id: 'pending', label: 'Pendientes', count: providers.filter((p) => !p.is_approved && p.is_active).length },
    { id: 'approved', label: 'Aprobados', count: providers.filter((p) => p.is_approved && !p.is_verified).length },
    { id: 'verified', label: 'Verificados', count: providers.filter((p) => p.is_verified).length },
  ]

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`admin-filter-${tab.id}`}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              filter === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>No hay proveedores en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 ${
                !p.is_active ? 'opacity-50 border-gray-100' : p.is_verified ? 'border-green-200' : p.is_approved ? 'border-blue-100' : 'border-amber-200'
              }`}
              id={`admin-provider-${p.id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900">{p.display_name}</h3>
                    {p.is_verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ Verificado</span>
                    )}
                    {p.is_approved && !p.is_verified && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Aprobado</span>
                    )}
                    {!p.is_approved && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⏳ Pendiente</span>
                    )}
                    {!p.is_active && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Inactivo</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>{p.profile?.email ?? '—'} · {p.profile?.full_name ?? '—'}</p>
                    <p>
                      {p.category?.name ?? '—'} · {p.city?.name ?? '—'}
                      {p.whatsapp && ` · 📱 ${p.whatsapp}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      Registrado: {new Date(p.created_at).toLocaleDateString('es-BO')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                  <Link
                    href={`/proveedores/${p.slug}?preview=admin`}
                    target="_blank"
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Ver perfil
                  </Link>

                  {!p.is_approved && p.is_active && (
                    <button
                      id={`admin-approve-${p.id}`}
                      disabled={saving === p.id}
                      onClick={() => updateProvider(p.id, { is_approved: true })}
                      className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60"
                    >
                      {saving === p.id ? '…' : 'Aprobar'}
                    </button>
                  )}

                  {p.is_approved && !p.is_verified && (
                    <button
                      id={`admin-verify-${p.id}`}
                      disabled={saving === p.id}
                      onClick={() => updateProvider(p.id, { is_verified: true })}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving === p.id ? '…' : 'Verificar'}
                    </button>
                  )}

                  {p.is_verified && (
                    <button
                      id={`admin-unverify-${p.id}`}
                      disabled={saving === p.id}
                      onClick={() => updateProvider(p.id, { is_verified: false })}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                    >
                      Quitar verificación
                    </button>
                  )}

                  {p.is_active ? (
                    <button
                      id={`admin-deactivate-${p.id}`}
                      disabled={saving === p.id}
                      onClick={() => updateProvider(p.id, { is_active: false, is_approved: false })}
                      className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      id={`admin-activate-${p.id}`}
                      disabled={saving === p.id}
                      onClick={() => updateProvider(p.id, { is_active: true })}
                      className="text-xs px-3 py-1.5 border border-green-200 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-60"
                    >
                      Reactivar
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
