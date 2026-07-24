import { createError, getRouterParam, readBody } from 'h3'
import { normalizeEmail, normalizeFullName, normalizePassword, normalizeStaffRole, requireSuperAdmin } from '../../utils/staffAccess'

export default defineEventHandler(async (event) => {
  const { serviceClient, userId } = await requireSuperAdmin(event)
  const targetId = getRouterParam(event, 'id')
  if (!targetId) throw createError({ statusCode: 400, message: 'ID-ja e stafit mungon.' })

  const body = await readBody<Record<string, unknown>>(event)
  const email = normalizeEmail(body.email)
  const fullName = normalizeFullName(body.full_name)
  const role = normalizeStaffRole(body.role)
  const password = normalizePassword(body.password)
  const phone = String(body.phone || '').trim() || null
  const isActive = body.is_active !== false

  const { data: target } = await serviceClient.from('profiles').select('id, role, is_active').eq('id', targetId).maybeSingle()
  if (!target) throw createError({ statusCode: 404, message: 'Përdoruesi nuk u gjet.' })

  if (targetId === userId && (!isActive || role !== 'superadmin')) {
    throw createError({ statusCode: 400, message: 'Nuk mund ta çaktivizoni ose ulni rolin e llogarisë suaj.' })
  }

  if (target.role === 'superadmin' && target.is_active && (!isActive || role !== 'superadmin')) {
    const { count } = await serviceClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'superadmin').eq('is_active', true)
    if ((count || 0) <= 1) {
      throw createError({ statusCode: 400, message: 'Duhet të mbetet së paku një superadmin aktiv.' })
    }
  }

  const { error: authError } = await serviceClient.auth.admin.updateUserById(targetId, {
    email,
    ...(password ? { password } : {}),
    user_metadata: { full_name: fullName }
  })
  if (authError) throw createError({ statusCode: 400, message: authError.message })

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .update({ email, full_name: fullName, phone, role, is_active: isActive })
    .eq('id', targetId)
    .select()
    .single()

  if (profileError) throw createError({ statusCode: 500, message: profileError.message })
  return profile
})
