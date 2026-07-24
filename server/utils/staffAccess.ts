import type { H3Event } from 'h3'
import { createError } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export async function requireSuperAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, message: 'Duhet të jeni të kyçur.' })
  }

  let serviceClient
  try {
    serviceClient = serverSupabaseServiceRole<Database>(event)
  } catch {
    throw createError({
      statusCode: 503,
      message: 'Menaxhimi i stafit kërkon NUXT_SUPABASE_SECRET_KEY në server.'
    })
  }

  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.sub)
    .maybeSingle()

  if (error || !profile?.is_active || profile.role !== 'superadmin') {
    throw createError({ statusCode: 403, message: 'Vetëm superadmin mund ta menaxhojë stafin.' })
  }

  return { serviceClient, userId: user.sub }
}

export function normalizeStaffRole(value: unknown) {
  if (value === 'staff' || value === 'admin' || value === 'superadmin') return value
  throw createError({ statusCode: 400, message: 'Roli i zgjedhur nuk është valid.' })
}

export function normalizeEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Email-i nuk është valid.' })
  }
  return email
}

export function normalizeFullName(value: unknown) {
  const fullName = String(value || '').trim().replace(/\s+/g, ' ')
  if (fullName.length < 2 || fullName.length > 120) {
    throw createError({ statusCode: 400, message: 'Emri i plotë duhet të ketë 2–120 karaktere.' })
  }
  return fullName
}

export function normalizePassword(value: unknown, required = false) {
  const password = String(value || '')
  if (!password && !required) return undefined
  if (password.length < 8 || password.length > 72) {
    throw createError({ statusCode: 400, message: 'Fjalëkalimi duhet të ketë 8–72 karaktere.' })
  }
  return password
}
