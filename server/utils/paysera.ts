import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import { createError } from 'h3'
import type { H3Event } from 'h3'

const PAYSERA_API_URL = 'https://api.paysera.com'
const TOKEN_PATH = '/auth/realms/Paysera/protocol/openid-connect/token'
const ORDER_PATH = '/merchant-order/integration/v1/orders'
const PAYMENT_LINK_PATH = '/checkout-payment-link/integration/v1/payment-links'
const TOKEN_REFRESH_BUFFER_SECONDS = 300
const REQUEST_TIMEOUT_MS = 10_000

export interface PayseraRuntimeConfig {
  clientId: string
  clientSecret: string
  siteUrl: string
  paymentLinkLifetimeSeconds: number
  reservationHoldSeconds: number
}

interface PayseraTokenResponse {
  access_token?: string
  expires_in?: number
}

interface PayseraOrderResponse {
  id?: string
  order_id?: string
  reference?: string
  amount?: number
  amount_paid?: number
  currency?: string
  status?: string
}

interface PayseraPaymentLinkResponse {
  link_id?: string
  order_id?: string
  payment_URL?: string
}

export interface PayseraCheckout {
  orderId: string
  linkId: string
  checkoutUrl: string
}

export interface VerifiedPayseraOrder {
  orderId: string
  reference: string
  amount: number
  amountPaid: number
  currency: string
  status: string
}

let tokenCache: { clientId: string, accessToken: string, expiresAt: number } | null = null
let tokenRequest: { clientId: string, promise: Promise<string> } | null = null
let providerReadinessCache: { clientId: string, ready: boolean, expiresAt: number } | null = null

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, positiveInteger(value, fallback)))
}

function parseSiteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''

  try {
    const url = new URL(raw)
    const localDevelopment = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol !== 'https:' && !localDevelopment) throw new Error('HTTPS is required')
    return url.origin
  } catch {
    return null
  }
}

function normalizedSiteUrl(value: unknown) {
  const siteUrl = parseSiteUrl(value)
  if (siteUrl) return siteUrl

  throw createError({
    statusCode: 503,
    message: 'Adresa publike e faqes nuk eshte konfiguruar per pagesa.'
  })
}

export function isPayseraCheckoutConfigured(event: H3Event) {
  const config = useRuntimeConfig(event)

  return Boolean(
    String(config.payseraClientId || '').trim()
    && String(config.payseraClientSecret || '').trim()
    && parseSiteUrl(config.public.siteUrl)
  )
}

export function requirePayseraConfig(event: H3Event): PayseraRuntimeConfig {
  const config = useRuntimeConfig(event)
  const clientId = String(config.payseraClientId || '').trim()
  const clientSecret = String(config.payseraClientSecret || '').trim()

  if (!clientId || !clientSecret) {
    throw createError({
      statusCode: 503,
      message: 'Pagesa me Paysera nuk eshte konfiguruar ende.'
    })
  }

  const paymentLinkLifetimeSeconds = boundedInteger(
    config.payseraPaymentLinkLifetimeSeconds,
    900,
    300,
    3600
  )
  const configuredHoldSeconds = boundedInteger(
    config.payseraReservationHoldSeconds,
    1200,
    600,
    7200
  )

  return {
    clientId,
    clientSecret,
    siteUrl: normalizedSiteUrl(config.public.siteUrl),
    paymentLinkLifetimeSeconds,
    reservationHoldSeconds: Math.max(
      configuredHoldSeconds,
      paymentLinkLifetimeSeconds + 300
    )
  }
}

function providerError(operation: string, status: number, body: unknown) {
  const providerCode = body && typeof body === 'object' && 'error' in body
    ? String(body.error)
    : 'unknown'

  console.error(`[paysera] ${operation} failed`, { status, providerCode })
  return createError({
    statusCode: 502,
    message: 'Paysera nuk mund ta pergatiste pagesen. Provo perseri pas pak.'
  })
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json() as unknown
  } catch {
    return null
  }
}

async function requestAccessToken(config: PayseraRuntimeConfig) {
  const now = Math.floor(Date.now() / 1000)
  let response: Response
  try {
    response = await fetch(`${PAYSERA_API_URL}${TOKEN_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
  } catch {
    throw createError({
      statusCode: 503,
      message: 'Paysera nuk eshte e arritshme tani. Provo perseri pas pak.'
    })
  }

  const body = await parseJsonResponse(response) as PayseraTokenResponse | null
  if (!response.ok || !body?.access_token) {
    throw providerError('OAuth token', response.status, body)
  }

  const expiresIn = positiveInteger(body.expires_in, 3600)
  tokenCache = {
    clientId: config.clientId,
    accessToken: body.access_token,
    expiresAt: now + Math.max(60, expiresIn - TOKEN_REFRESH_BUFFER_SECONDS)
  }
  return body.access_token
}

async function getAccessToken(config: PayseraRuntimeConfig) {
  const now = Math.floor(Date.now() / 1000)
  if (
    tokenCache
    && tokenCache.clientId === config.clientId
    && tokenCache.expiresAt > now
  ) {
    return tokenCache.accessToken
  }

  if (tokenRequest?.clientId === config.clientId) {
    return tokenRequest.promise
  }

  const promise = requestAccessToken(config)
  tokenRequest = { clientId: config.clientId, promise }

  try {
    return await promise
  } finally {
    if (tokenRequest?.promise === promise) tokenRequest = null
  }
}

export async function isPayseraProviderReady(event: H3Event, force = false) {
  let config: PayseraRuntimeConfig
  try {
    config = requirePayseraConfig(event)
  } catch {
    return false
  }

  const now = Date.now()
  if (
    !force
    && providerReadinessCache?.clientId === config.clientId
    && providerReadinessCache.expiresAt > now
  ) {
    return providerReadinessCache.ready
  }

  try {
    await getAccessToken(config)
    providerReadinessCache = {
      clientId: config.clientId,
      ready: true,
      expiresAt: now + 5 * 60_000
    }
    return true
  } catch {
    providerReadinessCache = {
      clientId: config.clientId,
      ready: false,
      expiresAt: now + 60_000
    }
    return false
  }
}

async function payseraRequest<T>(
  config: PayseraRuntimeConfig,
  operation: string,
  path: string,
  init: RequestInit
): Promise<T> {
  const accessToken = await getAccessToken(config)
  const send = async (token: string) => {
    try {
      return await fetch(`${PAYSERA_API_URL}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/json',
          ...(init.body ? { 'content-type': 'application/json' } : {}),
          ...init.headers
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
    } catch {
      throw createError({
        statusCode: 503,
        message: 'Paysera nuk eshte e arritshme tani. Provo perseri pas pak.'
      })
    }
  }

  let response = await send(accessToken)
  if (response.status === 401) {
    if (tokenCache?.accessToken === accessToken) tokenCache = null
    response = await send(await getAccessToken(config))
  }

  const body = await parseJsonResponse(response)
  if (!response.ok) {
    throw providerError(operation, response.status, body)
  }

  return body as T
}

function requiredString(value: unknown, operation: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw providerError(operation, 502, { error: 'invalid_response' })
  }
  return value
}

function verifiedCheckoutUrl(value: unknown) {
  const raw = requiredString(value, 'payment link')

  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.hostname !== 'api.paysera.com') {
      throw new Error('Unexpected checkout host')
    }
    return url.toString()
  } catch {
    throw providerError('payment link', 502, { error: 'invalid_checkout_url' })
  }
}

export async function createPayseraCheckout(
  config: PayseraRuntimeConfig,
  input: {
    reference: string
    amountMinor: number
    currency: string
    customerName: string
    customerEmail: string | null
    reservationId: string
  }
): Promise<PayseraCheckout> {
  const successUrl = `${config.siteUrl}/rezervimi/sukses?reference=${encodeURIComponent(input.reservationId)}`
  const failureUrl = `${config.siteUrl}/rezervimi/deshtoi?reference=${encodeURIComponent(input.reservationId)}`
  const callbackUrl = `${config.siteUrl}/api/payments/paysera/webhook`

  const order = await payseraRequest<PayseraOrderResponse>(
    config,
    'order creation',
    ORDER_PATH,
    {
      method: 'POST',
      body: JSON.stringify({
        redirect_urls: {
          success_url: successUrl,
          failure_url: failureUrl,
          callback_url: callbackUrl
        },
        purchase: {
          reference: input.reference,
          amount: input.amountMinor,
          currency: input.currency
        }
      })
    }
  )
  const orderId = requiredString(order.order_id || order.id, 'order creation')

  const payerInformation = input.customerEmail
    ? { name: input.customerName, email: input.customerEmail }
    : { name: input.customerName }

  const link = await payseraRequest<PayseraPaymentLinkResponse>(
    config,
    'payment link creation',
    PAYMENT_LINK_PATH,
    {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        name: `Rezervimi ${input.reference}`,
        lifetime: config.paymentLinkLifetimeSeconds,
        experience: {
          language: 'en',
          payment_flow: 'paysera_checkout'
        },
        purchase: {
          amount: input.amountMinor
        },
        payment_details: {
          purpose: `Diamond Tennis - ${input.reference}`
        },
        payer_information: payerInformation
      })
    }
  )

  return {
    orderId,
    linkId: requiredString(link.link_id, 'payment link creation'),
    checkoutUrl: verifiedCheckoutUrl(link.payment_URL)
  }
}

export async function getVerifiedPayseraOrder(
  config: PayseraRuntimeConfig,
  orderId: string
): Promise<VerifiedPayseraOrder> {
  const order = await payseraRequest<PayseraOrderResponse>(
    config,
    'order verification',
    `${ORDER_PATH}/${encodeURIComponent(orderId)}`,
    { method: 'GET' }
  )

  const amount = Number(order.amount)
  const amountPaid = Number(order.amount_paid ?? 0)
  if (!Number.isInteger(amount) || amount <= 0 || !Number.isInteger(amountPaid) || amountPaid < 0) {
    throw providerError('order verification', 502, { error: 'invalid_amount' })
  }

  return {
    orderId: requiredString(order.id || order.order_id, 'order verification'),
    reference: requiredString(order.reference, 'order verification'),
    amount,
    amountPaid,
    currency: requiredString(order.currency, 'order verification').toUpperCase(),
    status: requiredString(order.status, 'order verification')
  }
}

export function verifyPayseraWebhookSignature(
  rawBody: string,
  signature: string,
  clientSecret: string
) {
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false

  const expected = createHmac('sha256', clientSecret).update(rawBody, 'utf8').digest('hex')
  const suppliedBuffer = Buffer.from(signature.toLowerCase(), 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer)
}

export function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
