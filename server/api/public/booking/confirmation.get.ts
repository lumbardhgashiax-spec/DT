import { createError, getQuery } from 'h3'
import {
  academyDateFromIso,
  academyTimeFromIso,
  isMissingBookingReferenceColumn,
  requirePublicBookingService,
  requirePublicUuid,
  setPublicResponseHeaders
} from '../../../utils/publicBooking'
import { enforcePublicRateLimit } from '../../../utils/publicRateLimit'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'confirmation')

  const reference = requirePublicUuid(getQuery(event).reference, 'Referenca e rezervimit nuk \u00ebsht\u00eb valide.')
  const client = await requirePublicBookingService(event)
  const reservationResult = await client
    .from('reservations')
    .select('id, booking_reference, court_id, start_at, end_at, price, status, created_at')
    .eq('id', reference)
    .maybeSingle()
  let reservation = reservationResult.data
  let reservationError = reservationResult.error

  if (reservationError && isMissingBookingReferenceColumn(reservationError)) {
    const fallbackResult = await client
      .from('reservations')
      .select('id, court_id, start_at, end_at, price, status, created_at')
      .eq('id', reference)
      .maybeSingle()

    reservation = fallbackResult.data
      ? {
          ...fallbackResult.data,
          booking_reference: fallbackResult.data.id
        }
      : null
    reservationError = fallbackResult.error
  }

  if (reservationError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Konfirmimi nuk mund t\u00eb ngarkohej tani.'
    })
  }

  if (!reservation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Konfirmimi i rezervimit nuk u gjet.'
    })
  }

  const { data: court, error: courtError } = await client
    .from('courts')
    .select('name')
    .eq('id', reservation.court_id)
    .maybeSingle()

  if (courtError || !court) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Konfirmimi nuk mund t\u00eb ngarkohej tani.'
    })
  }

  const startAt = new Date(reservation.start_at)
  const endAt = new Date(reservation.end_at)
  const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000)

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Konfirmimi nuk mund t\u00eb ngarkohej tani.'
    })
  }

  return {
    reference: reservation.id,
    bookingReference: reservation.booking_reference || reservation.id,
    courtName: court.name,
    date: academyDateFromIso(reservation.start_at),
    time: academyTimeFromIso(reservation.start_at),
    endTime: academyTimeFromIso(reservation.end_at),
    durationMinutes,
    totalPrice: Number(reservation.price),
    currency: 'EUR' as const,
    status: reservation.status,
    createdAt: reservation.created_at
  }
})
