// Shared Resend sender used by all transactional/auth email functions.
// Sends through the Lovable connector gateway (no direct Resend SDK).
//
// Resilience built in:
//  • Per-instance throttle (≤ 5 requêtes/sec) pour respecter la limite Resend.
//  • Retries automatiques avec backoff exponentiel + jitter sur 429 et 5xx.
//  • Respect strict du header `Retry-After` renvoyé par Resend lorsqu'il est présent.
//  • Retries sur erreurs réseau transitoires (timeout, fetch failed).

const RESEND_GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

// Resend permet 5 req/s sur le compte gratuit/entrée. On reste en dessous (4/s)
// pour absorber la concurrence côté gateway et éviter les 429 en rafale.
const MAX_REQUESTS_PER_SECOND = 4
const MIN_INTERVAL_MS = Math.ceil(1000 / MAX_REQUESTS_PER_SECOND)

// Politique de retry pour les erreurs transitoires (429 + 5xx + erreurs réseau).
const MAX_RETRIES = 4
const BASE_BACKOFF_MS = 600

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Throttle global au scope de l'instance d'edge function.
let nextAvailableAt = 0
async function throttle(): Promise<void> {
  const now = Date.now()
  if (nextAvailableAt <= now) {
    nextAvailableAt = now + MIN_INTERVAL_MS
    return
  }
  const wait = nextAvailableAt - now
  nextAvailableAt += MIN_INTERVAL_MS
  await sleep(wait)
}

function parseRetryAfterMs(headerValue: string | null): number | null {
  if (!headerValue) return null
  const trimmed = headerValue.trim()
  if (!trimmed) return null
  // Format secondes (entier ou flottant).
  const asNumber = Number(trimmed)
  if (Number.isFinite(asNumber)) {
    return Math.max(0, Math.round(asNumber * 1000))
  }
  // Format date HTTP.
  const asDate = Date.parse(trimmed)
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now())
  }
  return null
}

function backoffDelay(attempt: number, retryAfterMs: number | null): number {
  if (retryAfterMs !== null) {
    // On ajoute un petit jitter pour éviter qu'une rafale d'edge functions reparte en même temps.
    return retryAfterMs + Math.floor(Math.random() * 250)
  }
  const exp = BASE_BACKOFF_MS * Math.pow(2, attempt)
  const jitter = Math.floor(Math.random() * 400)
  return Math.min(exp + jitter, 8000)
}

async function performRequest(params: ResendSendParams, lovableApiKey: string, resendApiKey: string) {
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
  return { response, body }
}

export async function sendViaResend(params: ResendSendParams): Promise<ResendSendResult> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured')
  if (!resendApiKey) throw new Error('RESEND_API_KEY is not configured')

  let lastError: { ok: boolean; status: number; body: string } | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    await throttle()

    try {
      const { response, body } = await performRequest(params, lovableApiKey, resendApiKey)

      if (response.ok) {
        let resendId: string | undefined
        try {
          const parsed = JSON.parse(body)
          resendId = parsed?.id
        } catch {
          // ignore parse errors
        }
        return { ok: true, status: response.status, body, resendId }
      }

      const isRetryable =
        response.status === 429 ||
        response.status === 408 ||
        response.status >= 500

      lastError = { ok: false, status: response.status, body }

      if (!isRetryable || attempt === MAX_RETRIES) {
        return lastError
      }

      const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))
      const delay = backoffDelay(attempt, retryAfterMs)
      console.warn('[Resend] retrying after error', {
        attempt: attempt + 1,
        status: response.status,
        delayMs: delay,
        recipient: params.to,
      })
      await sleep(delay)
    } catch (err) {
      // Erreur réseau / fetch failure → on retente.
      lastError = {
        ok: false,
        status: 0,
        body: err instanceof Error ? err.message : 'network_error',
      }
      if (attempt === MAX_RETRIES) {
        return lastError
      }
      const delay = backoffDelay(attempt, null)
      console.warn('[Resend] network error, retrying', {
        attempt: attempt + 1,
        delayMs: delay,
        message: lastError.body,
      })
      await sleep(delay)
    }
  }

  return lastError ?? { ok: false, status: 0, body: 'unknown_error' }
}
