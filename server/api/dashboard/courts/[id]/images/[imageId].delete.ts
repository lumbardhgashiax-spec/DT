import { createError, getRouterParam } from 'h3'
import { requireDashboardAccess } from '../../../../../utils/dashboardAccess'
import { courtAdminRoles, courtImageBucket, requireUuid } from '../../../../../utils/courtManagement'

export default defineEventHandler(async (event) => {
  const { client } = await requireDashboardAccess(event, courtAdminRoles)
  const courtId = requireUuid(getRouterParam(event, 'id'))
  const imageId = requireUuid(getRouterParam(event, 'imageId'), 'ID-ja e fotografisë nuk është valide.')
  const { data: image, error: imageError } = await client
    .from('court_images')
    .select('id, court_id, storage_path')
    .eq('id', imageId)
    .eq('court_id', courtId)
    .maybeSingle()

  if (imageError) throw createError({ statusCode: 500, message: 'Fotografia nuk mund të verifikohej.' })
  if (!image) throw createError({ statusCode: 404, message: 'Fotografia nuk u gjet.' })

  const { error: rowError } = await client.from('court_images').delete().eq('id', image.id)
  if (rowError) throw createError({ statusCode: 500, message: 'Fotografia nuk mund të fshihej.' })

  const { error: storageError } = await client.storage.from(courtImageBucket).remove([image.storage_path])
  if (storageError) {
    throw createError({ statusCode: 500, message: 'Fotografia u largua nga galeria, por skedari duhet të pastrohet nga storage.' })
  }

  return { success: true }
})
