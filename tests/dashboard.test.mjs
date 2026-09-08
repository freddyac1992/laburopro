import assert from 'node:assert/strict'
import test from 'node:test'
import { getActivity, getProfileChecklist, getPublicationState } from '../src/lib/dashboard.ts'

test('public links require approval and an active profile', () => {
  assert.equal(getPublicationState({ is_active: true, is_approved: true }).isPublic, true)
  assert.equal(getPublicationState({ is_active: false, is_approved: true }).label, 'Perfil pausado')
  assert.equal(getPublicationState({ is_active: true, is_approved: false }).label, 'En revisión')
  assert.equal(getPublicationState({ is_active: false, is_approved: false }).isPublic, false)
})

test('activity uses matching periods without claiming unique people or conversions', () => {
  const metrics = { profileViewsToday: 1, leadsToday: 2, profileViewsLastSevenDays: 3, leadsLastSevenDays: 4, profileViewsLastThirtyDays: 5, leadsLastThirtyDays: 6, profileViews: 7, leadCount: 8 }
  for (const [period, views, contacts] of [['today', 1, 2], ['week', 3, 4], ['month', 5, 6], ['all', 7, 8]]) {
    assert.deepEqual(getActivity(metrics, period), { views, contacts })
  }
})

test('completion does not count blank services, short descriptions or a single photo as complete', () => {
  const profile = { whatsapp: '71234567', category: { name: 'Plomeros' }, city: { name: 'El Alto' }, description: 'Breve', services: ['Tuberias', '', '  '], price_reference: ' ', availability: null, profile_photo_path: 'profile.webp', work_photo_path: null }
  assert.equal(getProfileChecklist(profile).filter((item) => item.done).length, 2)
  const complete = { ...profile, description: 'a'.repeat(80), services: ['Uno', 'Dos', 'Tres'], price_reference: 'Bs 80', availability: 'Lunes', work_photo_path: 'work.webp' }
  assert.equal(getProfileChecklist(complete).every((item) => item.done), true)
})
