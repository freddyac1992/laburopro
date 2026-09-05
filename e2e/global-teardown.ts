import { readFile, rm } from 'node:fs/promises'
import { createQaAdminClient, FIXTURE_FILE, type QaFixture } from './supabase-fixtures'

export default async function globalTeardown() {
  try {
    const fixtureSource = await readFile(FIXTURE_FILE, 'utf8').catch(() => null)
    if (fixtureSource) {
      const fixture = JSON.parse(fixtureSource) as QaFixture
      const adminClient = createQaAdminClient()
      const { error } = await adminClient.auth.admin.deleteUser(fixture.providerUserId)
      if (error) throw error
    }
  } finally {
    await Promise.all([
      rm('e2e/.auth', { recursive: true, force: true }),
      rm(FIXTURE_FILE, { force: true }),
    ])
  }
}
