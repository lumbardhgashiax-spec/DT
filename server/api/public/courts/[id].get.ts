import { createError, getRouterParam } from 'h3'
import {
  requirePublicBookingService,
  requirePublicUuid,
  setPublicResponseHeaders
} from '../../../utils/publicBooking'
import { getPublicCourt } from '../../../utils/publicCourts'
import { enforcePublicRateLimit } from '../../../utils/publicRateLimit'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)
  enforcePublicRateLimit(event, 'courts')

  const courtId = requirePublicUuid(getRouterParam(event, 'id'))
  const client = await requirePublicBookingService(event)
  const court = await getPublicCourt(client, courtId)

  if (!court) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Fusha nuk u gjet.'
    })
  }

  return court
})
