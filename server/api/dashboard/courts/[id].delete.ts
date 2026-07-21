import { createError, getRouterParam } from 'h3'
import { requireDashboardAccess } from '../../../utils/dashboardAccess'
import { courtAdminRoles, courtImageBucket, requireUuid } from '../../../utils/courtManagement'

export default defineEventHandler(async (event) => {
  const { client } = await requireDashboardAccess(event, courtAdminRoles)
  const id = requireUuid(getRouterParam(event, 'id'))

  const { count: reservationsCount, error: reservationsError } = await client
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('court_id', id)

  if (reservationsError) throw createError({ statusCode: 500, statusMessage: 'Rezervimet e fushes nuk mund te verifikoheshin.' })
  if (reservationsCount) {
    throw createError({ statusCode: 409, statusMessage: 'Fusha nuk mund te fshihet sepse ka rezervime te lidhura. Caktivizoje nese nuk do te pranoje rezervime te reja.' })
  }

  const { data: images, error: imagesError } = await client
    .from('court_images')
    .select('storage_path')
    .eq('court_id', id)

  if (imagesError) throw createError({ statusCode: 500, statusMessage: 'Fotografite e fushes nuk mund te verifikoheshin.' })

  const { error, count } = await client.from('courts').delete({ count: 'exact' }).eq('id', id)
  if (error) throw createError({ statusCode: error.code === '23503' ? 409 : 400, statusMessage: error.code === '23503' ? 'Fusha nuk mund te fshihet sepse ka te dhena te lidhura.' : 'Fusha nuk mund te fshihet.' })
  if (!count) throw createError({ statusCode: 404, statusMessage: 'Fusha nuk u gjet.' })

  const paths = (images || []).map(image => image.storage_path)
  if (!paths.length) return { success: true, storageCleanupFailed: false }

  const { error: storageError } = await client.storage.from(courtImageBucket).remove(paths)
  return { success: true, storageCleanupFailed: Boolean(storageError) }
})
