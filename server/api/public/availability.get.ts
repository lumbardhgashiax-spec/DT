import { createError, getQuery } from 'h3'
import {
  academyDateTimeToIso,
  parsePublicDate,
  publicDayRange,
  publicEndTime,
  publicSlotTimes,
  requireActivePublicCourt,
  requirePublicBookingService,
  requirePublicUuid,
  setPublicResponseHeaders
} from '../../utils/publicBooking'
import { enforcePublicRateLimit } from '../../utils/publicRateLimit'
import { releaseExpiredPayseraHolds } from '../../utils/publicCheckout'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'availability')

  const query = getQuery(event)
  const courtId = requirePublicUuid(query.courtId)
  const date = parsePublicDate(query.date)
  const client = await requirePublicBookingService(event)

  await releaseExpiredPayseraHolds(client)
  await requireActivePublicCourt(client, courtId)

  const { startAt, endAt } = publicDayRange(date)
  const { data: reservations, error } = await client
    .from('reservations')
    .select('start_at, end_at')
    .eq('court_id', courtId)
    .neq('status', 'cancelled')
    .lt('start_at', endAt)
    .gt('end_at', startAt)

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Terminet nuk mund t\u00eb ngarkoheshin tani.'
    })
  }

  const occupiedRanges = (reservations || [])
    .map((reservation) => {
      const startAt = new Date(reservation.start_at).getTime()
      const endAt = new Date(reservation.end_at).getTime()

      return { startAt, endAt }
    })
    .filter(range => Number.isFinite(range.startAt) && Number.isFinite(range.endAt))

  const now = Date.now()
  const slots = publicSlotTimes().map((time) => {
    const slotStart = academyDateTimeToIso(date, time)
    const slotEnd = academyDateTimeToIso(date, publicEndTime(time))
    const slotStartAt = new Date(slotStart).getTime()
    const slotEndAt = new Date(slotEnd).getTime()
    const isOccupied = occupiedRanges.some(range => (
      range.startAt < slotEndAt && range.endAt > slotStartAt
    ))

    return {
      courtId,
      date,
      time,
      available: slotStartAt > now && !isOccupied
    }
  })

  return { courtId, date, slots }
})
