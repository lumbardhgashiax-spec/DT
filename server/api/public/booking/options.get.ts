import {
  ACADEMY_TIME_ZONE,
  PUBLIC_CLOSING_HOUR,
  PUBLIC_DURATION_MINUTES,
  PUBLIC_OPENING_HOUR,
  PUBLIC_SLOT_MINUTES,
  requirePublicBookingService,
  setPublicResponseHeaders
} from '../../../utils/publicBooking'
import { listPublicCourts, listPublicExtraServices } from '../../../utils/publicCourts'
import { enforcePublicRateLimit } from '../../../utils/publicRateLimit'

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'courts')

  const client = await requirePublicBookingService(event)
  const [courts, extraServices] = await Promise.all([
    listPublicCourts(client, false),
    listPublicExtraServices(client)
  ])

  return {
    timezone: ACADEMY_TIME_ZONE,
    openingHours: {
      start: hourLabel(PUBLIC_OPENING_HOUR),
      end: hourLabel(PUBLIC_CLOSING_HOUR)
    },
    slotMinutes: PUBLIC_SLOT_MINUTES,
    durationMinutes: PUBLIC_DURATION_MINUTES,
    courts: courts.map(court => ({
      id: court.id,
      name: court.name,
      courtType: court.courtType,
      imageUrl: court.imageUrl
    })),
    extraServices
  }
})
