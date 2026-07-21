import { requirePublicBookingService, setPublicResponseHeaders } from '../../../utils/publicBooking'
import { listPublicCourts } from '../../../utils/publicCourts'
import { enforcePublicRateLimit } from '../../../utils/publicRateLimit'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'courts')

  const client = await requirePublicBookingService(event)
  return { courts: await listPublicCourts(client) }
})
