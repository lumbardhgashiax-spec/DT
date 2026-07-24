import {
  createError,
  getHeader,
  readRawBody,
  setResponseHeader
} from 'h3'
import { requirePublicBookingService } from '../../../utils/publicBooking'
import {
  getVerifiedPayseraOrder,
  requirePayseraConfig,
  sha256,
  verifyPayseraWebhookSignature
} from '../../../utils/paysera'

interface PayseraWebhookPayload {
  event?: {
    type?: unknown
    name?: unknown
  }
  order?: {
    paysera_order_id?: unknown
    merchant_order_id?: unknown
    is_test?: unknown
  }
  payment?: {
    status?: unknown
  }
  is_test?: unknown
}

function requiredText(value: unknown, field: string, maxLength = 255) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `Paysera callback field ${field} is invalid.`
    })
  }
  return value.trim()
}

function parsedWebhook(rawBody: string): PayseraWebhookPayload {
  try {
    const value = JSON.parse(rawBody) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid body')
    return value as PayseraWebhookPayload
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Paysera callback body is invalid.'
    })
  }
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseHeader(event, 'x-content-type-options', 'nosniff')

  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (contentLength > 256 * 1024) {
    throw createError({ statusCode: 413, message: 'Paysera callback is too large.' })
  }

  const config = requirePayseraConfig(event)
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Paysera callback body is missing.' })
  }

  const signature = getHeader(event, 'x-paysera-signature') || ''
  const algorithm = (getHeader(event, 'x-paysera-signature-alg') || '').toUpperCase()
  if (
    algorithm !== 'HMAC-SHA256'
    || !verifyPayseraWebhookSignature(rawBody, signature, config.clientSecret)
  ) {
    throw createError({ statusCode: 401, message: 'Paysera callback signature is invalid.' })
  }

  const callbackId = requiredText(getHeader(event, 'x-paysera-callback-id'), 'callback_id')
  const requestId = getHeader(event, 'x-paysera-request-id') || ''
  const createdAtSeconds = Number(getHeader(event, 'x-paysera-created-at'))
  if (!Number.isInteger(createdAtSeconds) || createdAtSeconds <= 0) {
    throw createError({ statusCode: 400, message: 'Paysera callback timestamp is invalid.' })
  }

  const payload = parsedWebhook(rawBody)
  const eventType = requiredText(payload.event?.type, 'event.type', 100)
  const eventName = requiredText(payload.event?.name, 'event.name', 100)
  const providerOrderId = requiredText(payload.order?.paysera_order_id, 'order.paysera_order_id')
  const merchantOrderId = requiredText(payload.order?.merchant_order_id, 'order.merchant_order_id')

  const verifiedOrder = await getVerifiedPayseraOrder(config, providerOrderId)
  if (
    verifiedOrder.orderId !== providerOrderId
    || verifiedOrder.reference !== merchantOrderId
  ) {
    throw createError({
      statusCode: 422,
      message: 'Paysera callback order verification failed.'
    })
  }

  const paymentStatus = typeof payload.payment?.status === 'string'
    ? payload.payment.status.toLowerCase()
    : ''
  const providerStatus = ['refunded', 'chargeback'].includes(paymentStatus)
    ? paymentStatus
    : verifiedOrder.status.toLowerCase()

  const client = await requirePublicBookingService(event)
  const result = await client.rpc('process_paysera_webhook', {
    p_callback_id: callbackId,
    p_request_id: requestId,
    p_provider_order_id: verifiedOrder.orderId,
    p_merchant_order_id: verifiedOrder.reference,
    p_event_type: eventType,
    p_event_name: eventName,
    p_payload_sha256: sha256(rawBody),
    p_provider_created_at: new Date(createdAtSeconds * 1000).toISOString(),
    p_provider_status: providerStatus,
    p_amount_minor: verifiedOrder.amount,
    p_amount_paid_minor: verifiedOrder.amountPaid,
    p_currency: verifiedOrder.currency,
    p_is_test: payload.is_test === true || payload.order?.is_test === true
  })

  if (result.error) {
    console.error('[paysera-webhook] processing failed', {
      code: result.error.code,
      message: result.error.message,
      callbackId
    })
    throw createError({
      statusCode: 500,
      message: 'Paysera callback could not be processed.'
    })
  }

  return { ok: true, status: result.data }
})
