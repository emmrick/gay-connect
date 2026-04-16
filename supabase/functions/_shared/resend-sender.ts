// Shared Resend sender used by all transactional/auth email functions.
// Sends through the Lovable connector gateway (no direct Resend SDK).

const RESEND_GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

export interface ResendSendParams {
  to: string
  from: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface ResendSendResult {
  ok: boolean
  status: number
  body: string
  resendId?: string
}

export async function sendViaResend(params: ResendSendParams): Promise<ResendSendResult> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured')
  if (!resendApiKey) throw new Error('RESEND_API_KEY is not configured')

  const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': resendApiKey,
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    }),
  })

  const body = await response.text()
  let resendId: string | undefined
  try {
    const parsed = JSON.parse(body)
    resendId = parsed?.id
  } catch {
    // ignore
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    resendId,
  }
}
