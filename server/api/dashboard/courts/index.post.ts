import { createError, readBody } from 'h3'
import { requireDashboardAccess } from '../../../utils/dashboardAccess'
import { courtAdminRoles, courtValues } from '../../../utils/courtManagement'

export default defineEventHandler(async (event) => {
  const { client } = await requireDashboardAccess(event, courtAdminRoles)
  const values = courtValues(await readBody<unknown>(event))
  const { data, error } = await client.from('courts').insert(values).select().single()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.code === '23505' ? 'Ekziston tashmë një fushë me këtë emër.' : 'Fusha nuk mund të ruhej.' })
  }

  return data
})
