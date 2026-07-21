import { requireSuperAdmin } from '../../utils/staffAccess'

export default defineEventHandler(async (event) => {
  const { serviceClient } = await requireSuperAdmin(event)
  const { data, error } = await serviceClient.from('profiles').select('*').order('created_at')
  if (error) throw createError({ statusCode: 500, statusMessage: 'Stafi nuk mund të ngarkohej.' })
  return data || []
})
