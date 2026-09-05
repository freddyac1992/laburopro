import { mkdir, writeFile } from 'node:fs/promises'
import type { FullConfig } from '@playwright/test'
import {
  ADMIN_AUTH_FILE,
  FIXTURE_FILE,
  PROVIDER_AUTH_FILE,
  PROVIDER_DESKTOP_LOGOUT_AUTH_FILE,
  PROVIDER_MOBILE_LOGOUT_AUTH_FILE,
  PROVIDER_NAME,
  createQaAdminClient,
  signInForQa,
  storageStateForSession,
} from './supabase-fixtures'

export default async function globalSetup(config: FullConfig) {
  const adminClient = createQaAdminClient()
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const providerEmail = `e2e-provider-${runId}@qa.laburopro.test`
  const providerPassword = `Qa-${crypto.randomUUID()}-9a!`
  let providerUserId: string | null = null

  try {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: providerEmail,
      password: providerPassword,
      email_confirm: true,
      user_metadata: { full_name: PROVIDER_NAME },
    })
    if (error || !data.user) throw new Error(error?.message ?? 'No se pudo crear el proveedor temporal')
    providerUserId = data.user.id

    const adminEmail = process.env.QA_ADMIN_EMAIL?.trim()
    const adminPassword = process.env.QA_ADMIN_PASSWORD?.trim()
    if (!adminEmail || !adminPassword) {
      throw new Error('Faltan QA_ADMIN_EMAIL y QA_ADMIN_PASSWORD')
    }

    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('email', adminEmail)
      .maybeSingle()
    if (adminProfileError || adminProfile?.role !== 'admin') {
      throw new Error('QA_ADMIN_EMAIL no corresponde a un administrador del proyecto de QA')
    }

    const [providerSession, providerDesktopLogoutSession, providerMobileLogoutSession, adminSession] = await Promise.all([
      signInForQa(providerEmail, providerPassword),
      signInForQa(providerEmail, providerPassword),
      signInForQa(providerEmail, providerPassword),
      signInForQa(adminEmail, adminPassword),
    ])

    await mkdir('e2e/.auth', { recursive: true })
    await Promise.all([
      writeFile(PROVIDER_AUTH_FILE, JSON.stringify(storageStateForSession(providerSession, config))),
      writeFile(
        PROVIDER_DESKTOP_LOGOUT_AUTH_FILE,
        JSON.stringify(storageStateForSession(providerDesktopLogoutSession, config)),
      ),
      writeFile(
        PROVIDER_MOBILE_LOGOUT_AUTH_FILE,
        JSON.stringify(storageStateForSession(providerMobileLogoutSession, config)),
      ),
      writeFile(ADMIN_AUTH_FILE, JSON.stringify(storageStateForSession(adminSession, config))),
      writeFile(FIXTURE_FILE, JSON.stringify({ providerUserId, providerEmail })),
    ])
  } catch (error) {
    if (providerUserId) await adminClient.auth.admin.deleteUser(providerUserId)
    throw error
  }
}
