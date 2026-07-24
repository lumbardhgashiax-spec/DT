import { createError, readBody } from 'h3'
import { normalizeEmail, normalizeFullName, normalizePassword, normalizeStaffRole, requireSuperAdmin } from '../../utils/staffAccess'

export default defineEventHandler(async (event) => {
  const { serviceClient } = await requireSuperAdmin(event)
  const body = await readBody<Record<string, unknown>>(event)
  const email = normalizeEmail(body.email)
  const fullName = normalizeFullName(body.full_name)
  const password = normalizePassword(body.password, true)!
  const role = normalizeStaffRole(body.role)
  const phone = String(body.phone || '').trim() || null

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  if (authError || !authData.user) {
    throw createError({ statusCode: 400, message: authError?.message || 'Llogaria nuk u krijua.' })
  }

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email,
      full_name: fullName,
      phone,
      role,
      is_active: body.is_active !== false
    })
    .select()
    .single()

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    throw createError({ statusCode: 500, message: 'Profili nuk u krijua; llogaria Auth u rikthye.' })
  }

  return profile
})
