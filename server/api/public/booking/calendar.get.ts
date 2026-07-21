import { createError, getQuery, setResponseHeader } from 'h3'
import {
  ACADEMY_TIME_ZONE,
  academyDateFromIso,
  academyTimeFromIso,
  isMissingBookingReferenceColumn,
  requirePublicBookingService,
  requirePublicUuid,
  setPublicResponseHeaders
} from '../../../utils/publicBooking'
import { enforcePublicRateLimit } from '../../../utils/publicRateLimit'

function escapeIcsText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll(/\r?\n/g, '\\n')
}

function formatIcsDateTime(value: string) {
  const date = academyDateFromIso(value).replaceAll('-', '')
  const time = academyTimeFromIso(value).replaceAll(':', '')
  return `${date}T${time}00`
}

function formatIcsTimestamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'calendar')

  const reference = requirePublicUuid(getQuery(event).reference, 'Referenca e rezervimit nuk është valide.')
  const client = await requirePublicBookingService(event)
  const reservationResult = await client
    .from('reservations')
    .select('id, booking_reference, court_id, start_at, end_at, status')
    .eq('id', reference)
    .maybeSingle()
  let reservation = reservationResult.data
  let reservationError = reservationResult.error

  if (reservationError && isMissingBookingReferenceColumn(reservationError)) {
    const fallbackResult = await client
      .from('reservations')
      .select('id, court_id, start_at, end_at, status')
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
    throw createError({ statusCode: 500, statusMessage: 'Kalendari nuk mund të përgatitet tani.' })
  }

  if (!reservation || reservation.status === 'cancelled') {
    throw createError({ statusCode: 404, statusMessage: 'Rezervimi nuk është i disponueshëm për kalendar.' })
  }

  const { data: court, error: courtError } = await client
    .from('courts')
    .select('name')
    .eq('id', reservation.court_id)
    .maybeSingle()

  if (courtError || !court) {
    throw createError({ statusCode: 500, statusMessage: 'Kalendari nuk mund të përgatitet tani.' })
  }

  const displayReference = reservation.booking_reference || reservation.id
  const calendarFile = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Diamond Tennis Academy//Rezervime//SQ',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Diamond Tennis Academy',
    `X-WR-TIMEZONE:${ACADEMY_TIME_ZONE}`,
    'BEGIN:VEVENT',
    `UID:${reservation.id}@diamondtennis.academy`,
    `DTSTAMP:${formatIcsTimestamp(new Date())}`,
    `DTSTART;TZID=${ACADEMY_TIME_ZONE}:${formatIcsDateTime(reservation.start_at)}`,
    `DTEND;TZID=${ACADEMY_TIME_ZONE}:${formatIcsDateTime(reservation.end_at)}`,
    `SUMMARY:${escapeIcsText(`Diamond Tennis - ${court.name}`)}`,
    `DESCRIPTION:${escapeIcsText(`Rezervimi ${displayReference}\nFusha: ${court.name}`)}`,
    `LOCATION:${escapeIcsText('Diamond Tennis Academy, Hajvali')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].join('\r\n')

  setResponseHeader(event, 'content-type', 'text/calendar; charset=utf-8')
  setResponseHeader(event, 'content-disposition', `attachment; filename="diamond-tennis-${displayReference}.ics"`)
  setResponseHeader(event, 'cache-control', 'no-store')

  return calendarFile
})
