import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  ADMIN_AUTH_FILE,
  FIXTURE_FILE,
  PROVIDER_AUTH_FILE,
  PROVIDER_NAME,
  approveProviderForQa,
  createQaAdminClient,
  type QaFixture,
} from './supabase-fixtures'

test.describe('proveedor autenticado', () => {
  test.use({ storageState: PROVIDER_AUTH_FILE })

  test('mantiene la sesión, crea el perfil y gestiona un contacto', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: `Hola, ${PROVIDER_NAME}` })).toBeVisible()
    await expect(page.getByText(PROVIDER_NAME, { exact: true }).first()).toBeVisible()

    await page.goto('/dashboard/perfil')
    await page.locator('#perfil-nombre').fill(PROVIDER_NAME)
    await page.locator('#perfil-categoria').selectOption({ label: 'Plomeros' })
    await page.locator('#perfil-ciudad').selectOption({ label: 'El Alto' })
    await page.locator('#perfil-zona').fill('Zona QA')
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.locator('#perfil-descripcion').fill('Perfil creado automáticamente para verificar el flujo completo.')
    await page.locator('#perfil-servicios').fill('Instalaciones, reparaciones')
    await page.locator('#perfil-experiencia').fill('5')
    await page.locator('#perfil-disponibilidad').fill('De lunes a sábado')
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.locator('#perfil-whatsapp').fill('71234567')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.locator('#perfil-submit-btn').click()
    await expect(page.getByRole('status')).toContainText('Tu perfil fue guardado correctamente')

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Actualizar mi información' })).toBeVisible()
    await expect(page.locator('#perfil-nombre')).toHaveValue(PROVIDER_NAME)

    const fixture = JSON.parse(await readFile(FIXTURE_FILE, 'utf8')) as QaFixture
    const providerId = await approveProviderForQa(fixture.providerUserId)
    const adminClient = createQaAdminClient()

    const leadResponse = await page.request.post('/api/leads', {
      data: {
        providerId,
        source: 'qa-e2e',
        message: 'Contacto generado por la prueba automática.',
      },
    })
    expect(leadResponse.ok()).toBeTruthy()

    await page.goto('/dashboard/contactos')
    await expect(page.getByText('Contacto generado por la prueba automática.')).toBeVisible()
    const statusSelect = page.getByLabel('¿Qué pasó con esta persona?')
    await statusSelect.selectOption('contacted')
    await expect(statusSelect).toHaveValue('contacted')

    const { data: updatedLead } = await adminClient
      .from('leads')
      .select('status')
      .eq('provider_id', providerId)
      .single()
    expect(updatedLead?.status).toBe('contacted')

    await page.locator('#header-logout-btn').click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('impide que un proveedor entre al panel administrativo', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Encuentra a alguien para hacer el trabajo.' })).toBeVisible()
  })

  test('cierra la sesión desde un teléfono', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.locator('#dashboard-mobile-logout-btn').click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/dashboard/contactos')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('administrador autenticado', () => {
  test.use({ storageState: ADMIN_AUTH_FILE })

  test('puede abrir todos los módulos administrativos', async ({ page }) => {
    const modules = [
      ['/admin', 'Panel de administración'],
      ['/admin/proveedores', 'Gestión de proveedores'],
      ['/admin/contactos', 'Leads y contactos'],
      ['/admin/resenas', 'Moderación de reseñas'],
      ['/admin/reportes', 'Reportes de proveedores'],
    ] as const

    for (const [path, heading] of modules) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
  })
})
