import { readBody } from 'h3'
import {
  requirePublicBookingService,
  setPublicResponseHeaders
} from '../../utils/publicBooking'
import {
  createPublicPayseraCheckout,
  parsePublicCheckoutInput
} from '../../utils/publicCheckout'
import { enforcePublicRateLimit } from '../../utils/publicRateLimit'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'booking')

  const input = parsePublicCheckoutInput(await readBody<unknown>(event))
  const client = await requirePublicBookingService(event)
  const checkout = await createPublicPayseraCheckout(event, client, input)

  return {
    paymentStatus: checkout.paymentStatus,
    checkoutUrl: checkout.checkoutUrl,
    expiresAt: checkout.expiresAt
  }
})
