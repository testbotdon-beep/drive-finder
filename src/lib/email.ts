import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key || key.includes('REPLACE_ME')) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

const FROM = process.env.FROM_EMAIL?.trim() || 'onboarding@resend.dev'

export async function sendRequestReceived(params: {
  to: string
  name: string
  requestId: string
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] Resend not configured, skipping sendRequestReceived')
    return
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'We got your request',
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #0a1628; font-weight: 700;">Hi ${escapeHtml(params.name)},</h2>
  <p style="color: #334155; line-height: 1.6;">Thanks for submitting. We're checking which top rated instructors are currently available and match your criteria.</p>
  <p style="color: #334155; line-height: 1.6;">If we find a good match, we'll send you a payment link within a week. If we can't find anyone suitable, we'll let you know and you won't be charged anything.</p>
  <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">Request ID: ${escapeHtml(params.requestId)}</p>
  <p style="color: #94a3b8; font-size: 13px; margin-top: 8px;">Drive Finder SG</p>
</div>`,
    })
  } catch (e) {
    console.error('[email] sendRequestReceived failed', e)
  }
}

export async function sendPaymentLink(params: {
  to: string
  name: string
  paymentUrl: string
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] Resend not configured, skipping sendPaymentLink')
    return
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'Good news: we found you 2 to 3 driving instructors',
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #0a1628; font-weight: 700;">Hi ${escapeHtml(params.name)},</h2>
  <p style="color: #334155; line-height: 1.6;">We've confirmed 2 to 3 available, high pass rate private driving instructors that match your criteria. We've already spoken to each of them and they're ready to take you on.</p>
  <p style="color: #334155; line-height: 1.6;">To receive their details and warm introductions, complete the $19 payment below:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${escapeHtml(params.paymentUrl)}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">Pay $19 and get your matches</a>
  </div>
  <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">Your card will be placed on a temporary hold. We only capture the payment once we deliver your instructor details. If anything goes wrong, you pay nothing.</p>
  <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Drive Finder SG</p>
</div>`,
    })
  } catch (e) {
    console.error('[email] sendPaymentLink failed', e)
  }
}

export async function sendMatchesDelivered(params: {
  to: string
  name: string
  matches: { name: string; phone: string; pass_rate: number; test_centre: string; class_type: string }[]
}) {
  const resend = getResend()
  if (!resend) return
  const rows = params.matches
    .map(
      (m) => `
<tr>
  <td style="padding:12px;border-bottom:1px solid #eee;">
    <div style="font-weight:600;">${escapeHtml(m.name)}</div>
    <div style="color:#666;font-size:13px;">${m.test_centre}, Class ${m.class_type}, ${Math.round(m.pass_rate * 100)}% pass rate</div>
  </td>
  <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">
    <a href="https://wa.me/65${m.phone.replace(/\s/g, '')}" style="color:#0a84ff;font-weight:600;text-decoration:none;">WhatsApp</a>
  </td>
</tr>`
    )
    .join('')
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'Your driving instructor matches are ready',
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #111;">Hi ${escapeHtml(params.name)},</h2>
  <p>Here are your verified, available matches:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
  <p>We've already spoken to each instructor and confirmed they have capacity to take you on. Message them now, slots move fast.</p>
  <p style="color: #666; font-size: 13px; margin-top: 32px;">Good luck with the test!<br>Drive Finder SG</p>
</div>`,
    })
  } catch (e) {
    console.error('[email] sendMatchesDelivered failed', e)
  }
}

export async function sendRequestFailed(params: { to: string; name: string }) {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: "Sorry, we couldn't find you a match",
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #111;">Hi ${escapeHtml(params.name)},</h2>
  <p>We weren't able to find an available instructor matching your criteria right now. Since you never paid, there's nothing to refund.</p>
  <p>If you'd like, reply to this email and we can suggest alternatives (different test centre, flexible timing, etc).</p>
  <p style="color: #666; font-size: 13px; margin-top: 32px;">Drive Finder SG</p>
</div>`,
    })
  } catch (e) {
    console.error('[email] sendRequestFailed failed', e)
  }
}

const ADMIN_EMAIL = 'gavin@uqlabs.co'

export async function sendAdminNotification(params: {
  requestId: string
  learnerName: string
  testCentre: string
  transmission: string
  notes: string
}) {
  const resend = getResend()
  if (!resend) return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://drivefindersg.uqlabs.co'
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New request: ${params.learnerName} (${params.testCentre} ${params.transmission})`,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #0a1628; font-weight: 700;">New match request</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(params.learnerName)}</td></tr>
    <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Centre</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(params.testCentre)}</td></tr>
    <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Transmission</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(params.transmission)}</td></tr>
    ${params.notes ? `<tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Notes</td><td style="padding: 8px 0;">${escapeHtml(params.notes)}</td></tr>` : ''}
  </table>
  <div style="margin-top: 20px;">
    <a href="${appUrl}/admin" style="display: inline-block; background: #0a1628; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Admin</a>
  </div>
</div>`,
    })
  } catch (e) {
    console.error('[email] sendAdminNotification failed', e)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
