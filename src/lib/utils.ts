import { WHATSAPP_BASE_URL } from './constants'

/**
 * Build a WhatsApp deep link URL
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const encodedMsg = message ? `?text=${encodeURIComponent(message)}` : ''
  return `${WHATSAPP_BASE_URL}${cleaned}${encodedMsg}`
}

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Format a number as Boliviano currency
 */
export function formatBOB(amount: number): string {
  return `Bs ${amount.toFixed(0)}`
}

/**
 * Truncate text to a given length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '…'
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

/**
 * Format a date to a readable Spanish string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
