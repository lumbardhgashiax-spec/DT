import { createError, getRouterParam } from 'h3'
import { requireSuperAdmin } from '../../utils/staffAccess'

export default defineEventHandler(async (event) => {
  const { serviceClient, userId } = await requireSuperAdmin(event)
  const targetId = getRouterParam(event, 'id')
  if (!targetId) throw createError({ statusCode: 400, message: 'ID-ja e stafit mungon.' })
  if (targetId === userId) throw createError({ statusCode: 400, message: 'Nuk mund ta fshini llogarinë tuaj.' })

  const { data: target } = await serviceClient.from('profiles').select('role, is_active').eq('id', targetId).maybeSingle()
  if (!target) throw createError({ statusCode: 404, message: 'Përdoruesi nuk u gjet.' })

  if (target.role === 'superadmin' && target.is_active) {
    const { count } = await serviceClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'superadmin').eq('is_active', true)
    if ((count || 0) <= 1) throw createError({ statusCode: 400, message: 'Nuk mund të fshihet superadmin-i i fundit aktiv.' })
  }

  const { error } = await serviceClient.auth.admin.deleteUser(targetId)
  if (error) throw createError({ statusCode: 400, message: error.message })
  return { success: true }
})
