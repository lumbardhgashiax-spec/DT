import { createError, getRouterParam, readBody } from 'h3'
import { requireDashboardAccess } from '../../../utils/dashboardAccess'
import { courtAdminRoles, courtValues, requireUuid } from '../../../utils/courtManagement'

export default defineEventHandler(async (event) => {
  const { client } = await requireDashboardAccess(event, courtAdminRoles)
  const id = requireUuid(getRouterParam(event, 'id'))
  const values = courtValues(await readBody<unknown>(event))
  const { data, error } = await client.from('courts').update(values).eq('id', id).select().maybeSingle()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.code === '23505' ? 'Ekziston tashmë një fushë me këtë emër.' : 'Fusha nuk mund të përditësohej.' })
  }
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Fusha nuk u gjet.' })

  return data
})
