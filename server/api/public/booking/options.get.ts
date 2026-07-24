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
import { isPayseraDatabaseReady } from '../../../utils/publicCheckout'
import {
  isPayseraCheckoutConfigured,
  isPayseraProviderReady
} from '../../../utils/paysera'
import { enforcePublicRateLimit } from '../../../utils/publicRateLimit'

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'courts')

  const client = await requirePublicBookingService(event)
  const [courts, extraServices, payseraDatabaseReady] = await Promise.all([
    listPublicCourts(client, false),
    listPublicExtraServices(client),
    isPayseraDatabaseReady(client)
  ])
  const payseraConfigured = isPayseraCheckoutConfigured(event)
  const payseraProviderReady = payseraConfigured
    && payseraDatabaseReady
    && await isPayseraProviderReady(event)

  return {
    timezone: ACADEMY_TIME_ZONE,
    openingHours: {
      start: hourLabel(PUBLIC_OPENING_HOUR),
      end: hourLabel(PUBLIC_CLOSING_HOUR)
    },
    slotMinutes: PUBLIC_SLOT_MINUTES,
    durationMinutes: PUBLIC_DURATION_MINUTES,
    payment: {
      provider: 'paysera' as const,
      available: payseraProviderReady
    },
    courts: courts.map(court => ({
      id: court.id,
      name: court.name,
      courtType: court.courtType,
      imageUrl: court.imageUrl
    })),
    extraServices
  }
})
