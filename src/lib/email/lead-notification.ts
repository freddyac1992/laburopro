import 'server-only'
import { SITE_URL } from '@/lib/constants'

type LeadNotificationInput = {
  leadId: string
  providerEmail: string
  providerName: string
  message: string | null
}

export type LeadNotificationResult = 'sent' | 'skipped' | 'failed'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function cleanHeader(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export async function sendNewLeadNotification({
  leadId,
  providerEmail,
  providerName,
  message,
}: LeadNotificationInput): Promise<LeadNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from || !providerEmail) return 'skipped'

  const safeProviderName = escapeHtml(providerName)
  const safeMessage = message ? escapeHtml(message) : null
  const dashboardUrl = `${SITE_URL}/dashboard/contactos?filter=new`
  const subjectName = cleanHeader(providerName).slice(0, 80)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `lead-${leadId}`,
      },
      body: JSON.stringify({
        from,
        to: [providerEmail],
        ...(process.env.RESEND_REPLY_TO ? { reply_to: process.env.RESEND_REPLY_TO } : {}),
        subject: `Nuevo contacto para ${subjectName}`,
        text: [
          `Hola ${providerName},`,
          '',
          'Una persona abrió WhatsApp desde tu perfil de LaburoPro.',
          message ? `Mensaje: ${message}` : null,
          '',
          `Revisa tus contactos: ${dashboardUrl}`,
          '',
          'Responde pronto para aumentar tus posibilidades de concretar el trabajo.',
        ].filter(Boolean).join('\n'),
        html: `
          <div style="background:#f4f7f6;padding:32px 16px;font-family:Arial,sans-serif;color:#102a33">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce7e4;border-radius:8px;overflow:hidden">
              <div style="background:#0f766e;padding:20px 24px;color:#ffffff;font-size:20px;font-weight:700">LaburoPro</div>
              <div style="padding:28px 24px">
                <h1 style="font-size:22px;margin:0 0 16px">Tienes un nuevo contacto</h1>
                <p style="line-height:1.6;margin:0 0 16px">Hola ${safeProviderName}, una persona abrió WhatsApp desde tu perfil.</p>
                ${safeMessage ? `<div style="background:#f4f7f6;border-left:4px solid #e85d3f;padding:14px 16px;margin:0 0 20px;line-height:1.5">${safeMessage}</div>` : ''}
                <a href="${dashboardUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px">Revisar contacto</a>
                <p style="font-size:13px;color:#5f6f73;line-height:1.5;margin:22px 0 0">Responde pronto para aumentar tus posibilidades de concretar el trabajo.</p>
              </div>
            </div>
          </div>
        `,
        tags: [{ name: 'lead_id', value: leadId }],
      }),
    })

    if (!response.ok) {
      console.error('Lead email notification failed', { status: response.status, leadId })
      return 'failed'
    }

    return 'sent'
  } catch (error) {
    console.error('Lead email notification failed', {
      leadId,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return 'failed'
  }
}
