import { createHash } from 'node:crypto'
import { createError } from 'h3'
import type { H3Event } from 'h3'
import {
  academyDateTimeToIso,
  parsePublicCreateBookingInput,
  publicBookingReference,
  publicEndTime,
  resolvePublicBookingQuote
} from './publicBooking'
import type {
  PublicCreateBookingInput,
  PublicServiceClient
} from './publicBooking'
import {
  createPayseraCheckout,
  isPayseraProviderReady,
  requirePayseraConfig
} from './paysera'

interface PublicCheckoutInput extends PublicCreateBookingInput {
  checkoutRequestId: string
  legalAccepted: true
}

interface CheckoutRegistration {
  reservation_id: string
  booking_reference: string
  payment_id: string
  payment_status: string
  provider_order_id: string | null
  provider_link_id: string | null
  checkout_url: string | null
  created_at: string
  created_new: boolean
}

export interface PublicCheckoutResponse {
  reference: string
  bookingReference: string
  courtName: string
  date: string
  time: string
  endTime: string
  durationMinutes: number
  totalPrice: number
  currency: 'EUR'
  status: 'pending'
  paymentStatus: 'pending'
  checkoutUrl: string
  expiresAt: string
  createdAt: string
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
let missingPayseraMigrationWarned = false
let nextExpiredHoldCleanupAt = 0
let expiredHoldCleanupRequest: Promise<void> | null = null
let payseraDatabaseReadiness: { ready: boolean, expiresAt: number } | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isMissingPayseraMigration(error: unknown) {
  if (!isRecord(error)) return false
  const code = typeof error.code === 'string' ? error.code : ''
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : ''
  const schemaObject = [
    'payment_transactions',
    'booking_reference',
    'register_paysera_checkout',
    'release_expired_paysera_holds',
    'set_paysera_checkout_details',
    'fail_paysera_checkout'
  ].some(name => message.includes(name))

  return schemaObject && (
    ['PGRST202', 'PGRST204', 'PGRST205', '42703', '42P01'].includes(code)
    || message.includes('schema cache')
    || message.includes('does not exist')
  )
}

function payseraDatabaseUnavailable() {
  return createError({
    statusCode: 503,
    message: 'Pagesa online po aktivizohet. Provo perseri pas pak.'
  })
}

export async function isPayseraDatabaseReady(
  client: PublicServiceClient,
  force = false
) {
  const now = Date.now()
  if (!force && payseraDatabaseReadiness && payseraDatabaseReadiness.expiresAt > now) {
    return payseraDatabaseReadiness.ready
  }

  const [paymentTable, bookingReference] = await Promise.all([
    client
      .from('payment_transactions')
      .select('id')
      .limit(1),
    client
      .from('reservations')
      .select('booking_reference')
      .limit(1)
  ])
  const ready = !paymentTable.error && !bookingReference.error
  payseraDatabaseReadiness = {
    ready,
    expiresAt: now + (ready ? 60_000 : 10_000)
  }

  if (!ready && !missingPayseraMigrationWarned) {
    missingPayseraMigrationWarned = true
    console.error('[paysera-checkout] database migration is missing', {
      paymentTableCode: paymentTable.error?.code,
      bookingReferenceCode: bookingReference.error?.code
    })
  }

  return ready
}

export function parsePublicCheckoutInput(value: unknown): PublicCheckoutInput {
  const booking = parsePublicCreateBookingInput(value)
  const checkoutRequestId = isRecord(value) && typeof value.checkoutRequestId === 'string'
    ? value.checkoutRequestId
    : ''

  if (!uuidPattern.test(checkoutRequestId)) {
    throw createError({
      statusCode: 422,
      message: 'Kerkesa e pageses nuk eshte valide. Rifresko faqen dhe provo perseri.'
    })
  }

  if (!isRecord(value) || value.legalAccepted !== true) {
    throw createError({
      statusCode: 422,
      message: 'Prano kushtet, politiken e privatesise dhe rregullat e anulimit para pageses.'
    })
  }

  return { ...booking, checkoutRequestId, legalAccepted: true }
}

function amountInMinorUnits(value: number) {
  const amount = Math.round(value * 100)
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw createError({
      statusCode: 500,
      message: 'Cmimi i rezervimit nuk mund te procesohet.'
    })
  }
  return amount
}

function checkoutFingerprint(input: PublicCheckoutInput, quote: Awaited<ReturnType<typeof resolvePublicBookingQuote>>) {
  const canonical = JSON.stringify({
    courtId: quote.courtId,
    seasonId: quote.seasonId,
    priceRuleId: quote.priceRuleId,
    date: input.date,
    time: input.time,
    durationMinutes: input.durationMinutes,
    extraServiceIds: [...input.extraServiceIds].sort(),
    totalPrice: quote.totalPrice,
    customer: input.customer
  })
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}

function registrationError(error: unknown) {
  if (!isRecord(error)) return createError({ statusCode: 500, message: 'Rezervimi nuk mund te ruhej.' })

  if (isMissingPayseraMigration(error)) {
    return payseraDatabaseUnavailable()
  }

  if (error.code === '23P01') {
    return createError({
      statusCode: 409,
      message: 'Ky termin sapo u rezervua. Zgjidh nje ore tjeter.'
    })
  }

  if (error.code === '22023') {
    return createError({
      statusCode: 409,
      message: 'Kjo kerkese pagese nuk mund te riperdoret.'
    })
  }

  console.error('[paysera-checkout] registration failed', {
    code: typeof error.code === 'string' ? error.code : undefined,
    message: typeof error.message === 'string' ? error.message : undefined
  })
  return createError({
    statusCode: 500,
    message: 'Rezervimi nuk mund te ruhej.'
  })
}

export async function releaseExpiredPayseraHolds(client: PublicServiceClient) {
  const now = Date.now()
  if (now < nextExpiredHoldCleanupAt) return
  if (expiredHoldCleanupRequest) return expiredHoldCleanupRequest

  nextExpiredHoldCleanupAt = now + 30_000
  expiredHoldCleanupRequest = (async () => {
    const { error } = await client.rpc('release_expired_paysera_holds')
    if (error) {
      if (isMissingPayseraMigration(error)) {
        if (!missingPayseraMigrationWarned) {
          missingPayseraMigrationWarned = true
          console.warn('[paysera-checkout] migration is not applied yet; expired hold cleanup skipped')
        }
        return
      }

      console.error('[paysera-checkout] expired hold cleanup failed', {
        code: error.code,
        message: error.message
      })
    }
  })()

  try {
    await expiredHoldCleanupRequest
  } finally {
    expiredHoldCleanupRequest = null
  }
}

export async function createPublicPayseraCheckout(
  event: H3Event,
  client: PublicServiceClient,
  input: PublicCheckoutInput
): Promise<PublicCheckoutResponse> {
  const config = requirePayseraConfig(event)
  if (!await isPayseraDatabaseReady(client)) {
    throw payseraDatabaseUnavailable()
  }
  if (!await isPayseraProviderReady(event)) {
    throw createError({
      statusCode: 503,
      message: 'Pagesa me Paysera nuk eshte e disponueshme tani. Provo perseri pas pak.'
    })
  }
  await releaseExpiredPayseraHolds(client)

  const quote = await resolvePublicBookingQuote(client, input)
  const amountMinor = amountInMinorUnits(quote.totalPrice)
  const startAt = academyDateTimeToIso(input.date, input.time)
  const endTime = publicEndTime(input.time, input.durationMinutes)
  const endAt = academyDateTimeToIso(input.date, endTime)
  const expiresAt = new Date(Date.now() + config.reservationHoldSeconds * 1000).toISOString()
  const bookingReference = publicBookingReference()
  const fingerprint = checkoutFingerprint(input, quote)

  const registrationResult = await client.rpc('register_paysera_checkout', {
    p_checkout_request_id: input.checkoutRequestId,
    p_request_fingerprint: fingerprint,
    p_booking_reference: bookingReference,
    p_first_name: input.customer.firstName,
    p_last_name: input.customer.lastName,
    p_phone: input.customer.phone,
    p_email: input.customer.email,
    p_court_id: quote.courtId,
    p_season_id: quote.seasonId,
    p_price_rule_id: quote.priceRuleId,
    p_start_at: startAt,
    p_end_at: endAt,
    p_total_price: quote.totalPrice,
    p_amount_minor: amountMinor,
    p_currency: 'EUR',
    p_extra_service_ids: input.extraServiceIds,
    p_expires_at: expiresAt
  })

  if (registrationResult.error || !registrationResult.data?.[0]) {
    throw registrationError(registrationResult.error)
  }

  const registration = registrationResult.data[0] as CheckoutRegistration
  if (registration.checkout_url && registration.payment_status === 'pending') {
    return {
      reference: registration.reservation_id,
      bookingReference: registration.booking_reference,
      courtName: quote.courtName,
      date: input.date,
      time: input.time,
      endTime,
      durationMinutes: input.durationMinutes,
      totalPrice: quote.totalPrice,
      currency: 'EUR',
      status: 'pending',
      paymentStatus: 'pending',
      checkoutUrl: registration.checkout_url,
      expiresAt,
      createdAt: registration.created_at
    }
  }

  if (!registration.created_new) {
    throw createError({
      statusCode: 409,
      message: 'Pagesa eshte duke u pergatitur. Prit pak dhe provo perseri.'
    })
  }

  try {
    const checkout = await createPayseraCheckout(config, {
      reference: registration.booking_reference,
      amountMinor,
      currency: 'EUR',
      customerName: `${input.customer.firstName} ${input.customer.lastName}`,
      customerEmail: input.customer.email,
      reservationId: registration.reservation_id
    })

    const detailsResult = await client.rpc('set_paysera_checkout_details', {
      p_payment_id: registration.payment_id,
      p_provider_order_id: checkout.orderId,
      p_provider_link_id: checkout.linkId,
      p_checkout_url: checkout.checkoutUrl
    })
    if (detailsResult.error) throw registrationError(detailsResult.error)

    return {
      reference: registration.reservation_id,
      bookingReference: registration.booking_reference,
      courtName: quote.courtName,
      date: input.date,
      time: input.time,
      endTime,
      durationMinutes: input.durationMinutes,
      totalPrice: quote.totalPrice,
      currency: 'EUR',
      status: 'pending',
      paymentStatus: 'pending',
      checkoutUrl: checkout.checkoutUrl,
      expiresAt,
      createdAt: registration.created_at
    }
  } catch (error) {
    await client.rpc('fail_paysera_checkout', {
      p_payment_id: registration.payment_id
    })
    throw error
  }
}
