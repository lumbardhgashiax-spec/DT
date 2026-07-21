import { readBody } from 'h3'
import {
  createPublicBooking,
  parsePublicCreateBookingInput,
  requirePublicBookingService,
  setPublicResponseHeaders
} from '../../utils/publicBooking'
import { enforcePublicRateLimit } from '../../utils/publicRateLimit'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'booking')

  const input = parsePublicCreateBookingInput(await readBody<unknown>(event))
  const client = await requirePublicBookingService(event)

  return createPublicBooking(client, input)
})
