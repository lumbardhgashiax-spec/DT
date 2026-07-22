import type { SupabaseClient } from '@supabase/supabase-js'
import { createError } from 'h3'
import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { useRuntimeConfig } from '#imports'
import type { Database, UserRole } from '~/types/database.types'

export const dashboardRoles = ['staff', 'admin', 'superadmin'] as const

export interface DashboardAccess {
  client: SupabaseClient<Database>
  userId: string
  profile: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'email' | 'full_name' | 'phone' | 'role' | 'is_active'>
}

export async function requireDashboardAccess(
  event: H3Event,
  allowedRoles: readonly UserRole[] = dashboardRoles
): Promise<DashboardAccess> {
  const runtimeConfig = useRuntimeConfig(event)
  const supabaseConfig = runtimeConfig.public?.supabase
  if (!supabaseConfig?.url || !supabaseConfig?.key) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Konfigurimi i Supabase mungon në server. Kontrolloni NUXT_PUBLIC_SUPABASE_URL dhe NUXT_PUBLIC_SUPABASE_KEY në Vercel.'
    })
  }

  const user = await serverSupabaseUser(event)
  if (!user?.sub || typeof user.sub !== 'string') {
    throw createError({ statusCode: 401, statusMessage: 'Duhet të jeni të kyçur.' })
  }

  // This client carries the caller's session and is therefore still protected by RLS.
  const client = await serverSupabaseClient<Database>(event)
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, email, full_name, phone, role, is_active')
    .eq('id', user.sub)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Profili i dashboard-it nuk mund të verifikohej.' })
  }

  if (!profile || !profile.is_active || !dashboardRoles.includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Kjo llogari nuk ka qasje aktive në dashboard.' })
  }

  if (!allowedRoles.includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Nuk keni autorizim për këtë veprim.' })
  }

  return { client, userId: user.sub, profile }
}
