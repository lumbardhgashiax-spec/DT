import { serverSupabaseServiceRole } from '#supabase/server'
import {
  publicBookingEnvironmentStatus,
  setPublicResponseHeaders
} from '../../utils/publicBooking'
import { isPayseraDatabaseReady } from '../../utils/publicCheckout'
import { isPayseraProviderReady } from '../../utils/paysera'
import type { Database } from '~/types/database.types'

function validPublicSiteUrl(value: unknown) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:'
      || url.hostname === 'localhost'
      || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  setPublicResponseHeaders(event)

  const runtimeConfig = useRuntimeConfig(event)
  const checks = {
    ...publicBookingEnvironmentStatus(),
    payseraCredentials: Boolean(
      String(runtimeConfig.payseraClientId || '').trim()
      && String(runtimeConfig.payseraClientSecret || '').trim()
    ),
    publicSiteUrl: validPublicSiteUrl(runtimeConfig.public.siteUrl)
  }
  if (!checks.supabaseUrl || !checks.supabasePublicKey || !checks.supabaseServerKey) {
    return {
      ok: false,
      service: 'public-booking',
      checks: {
        ...checks,
        database: false,
        payseraDatabase: false,
        payseraProvider: false
      }
    }
  }

  try {
    const client = serverSupabaseServiceRole<Database>(event)
    const [databaseResult, payseraDatabase, payseraProvider] = await Promise.all([
      client
        .from('courts')
        .select('id')
        .limit(1),
      isPayseraDatabaseReady(client, true),
      checks.payseraCredentials
        ? isPayseraProviderReady(event)
        : Promise.resolve(false)
    ])
    const database = !databaseResult.error

    return {
      ok: database
        && payseraDatabase
        && payseraProvider
        && checks.payseraCredentials
        && checks.publicSiteUrl,
      service: 'public-booking',
      checks: {
        ...checks,
        database,
        payseraDatabase,
        payseraProvider
      }
    }
  } catch {
    return {
      ok: false,
      service: 'public-booking',
      checks: {
        ...checks,
        database: false,
        payseraDatabase: false,
        payseraProvider: false
      }
    }
  }
})
