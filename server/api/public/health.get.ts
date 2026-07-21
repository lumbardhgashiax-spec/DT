import { serverSupabaseServiceRole } from '#supabase/server'
import {
  publicBookingEnvironmentStatus,
  setPublicResponseHeaders
} from '../../utils/publicBooking'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)

  const checks = publicBookingEnvironmentStatus()
  if (!checks.supabaseUrl || !checks.supabasePublicKey || !checks.supabaseServerKey) {
    return {
      ok: false,
      service: 'public-booking',
      checks: {
        ...checks,
        database: false
      }
    }
  }

  try {
    const client = serverSupabaseServiceRole<Database>(event)
    const { error } = await client
      .from('courts')
      .select('id', { head: true, count: 'exact' })
      .limit(1)

    return {
      ok: !error,
      service: 'public-booking',
      checks: {
        ...checks,
        database: !error
      }
    }
  } catch {
    return {
      ok: false,
      service: 'public-booking',
      checks: {
        ...checks,
        database: false
      }
    }
  }
})
