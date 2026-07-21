import { readBody } from 'h3'
import {
  parsePublicBookingSelection,
  publicQuoteResponse,
  requirePublicBookingService,
  resolvePublicBookingQuote,
  setPublicResponseHeaders
} from '../../../utils/publicBooking'
import { enforcePublicRateLimit } from '../../../utils/publicRateLimit'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'quote')

  const input = parsePublicBookingSelection(await readBody<unknown>(event))
  const client = await requirePublicBookingService(event)
  const quote = await resolvePublicBookingQuote(client, input)

  return publicQuoteResponse(quote)
})
