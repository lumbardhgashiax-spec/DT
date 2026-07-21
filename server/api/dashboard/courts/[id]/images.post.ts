import { createError, getRouterParam, readMultipartFormData } from 'h3'
import { requireDashboardAccess } from '../../../../utils/dashboardAccess'
import {
  courtAdminRoles,
  courtImageBucket,
  maxCourtImagesPerRequest,
  requireUuid,
  validateCourtImage
} from '../../../../utils/courtManagement'

export default defineEventHandler(async (event) => {
  const { client } = await requireDashboardAccess(event, courtAdminRoles)
  const courtId = requireUuid(getRouterParam(event, 'id'))

  const { data: court, error: courtError } = await client
    .from('courts')
    .select('id')
    .eq('id', courtId)
    .maybeSingle()
  if (courtError) throw createError({ statusCode: 500, statusMessage: 'Fusha nuk mund të verifikohej.' })
  if (!court) throw createError({ statusCode: 404, statusMessage: 'Fusha nuk u gjet.' })

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Kërkesa duhet të përmbajë fotografi.' })
  }

  const unexpectedFile = formData.find(part => part.filename && part.name !== 'images')
  if (unexpectedFile) {
    throw createError({ statusCode: 400, statusMessage: 'Fusha e skedarit nuk është valide.' })
  }

  const files = formData.filter(part => part.name === 'images' && part.filename)
  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: 'Zgjidh të paktën një fotografi.' })
  }
  if (files.length > maxCourtImagesPerRequest) {
    throw createError({ statusCode: 400, statusMessage: `Mund të ngarkohen maksimumi ${maxCourtImagesPerRequest} fotografi në një herë.` })
  }

  const normalizedFiles = files.map(file => ({ file, ...validateCourtImage(file) }))
  const { data: latestImage, error: latestImageError } = await client
    .from('court_images')
    .select('sort_order')
    .eq('court_id', courtId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestImageError) throw createError({ statusCode: 500, statusMessage: 'Renditja e fotografive nuk mund të lexohej.' })

  const uploadedPaths: string[] = []
  try {
    const rows = []
    for (const [index, item] of normalizedFiles.entries()) {
      const storagePath = `${courtId}/${crypto.randomUUID()}.${item.extension}`
      const { error } = await client.storage.from(courtImageBucket).upload(storagePath, item.file.data, {
        cacheControl: '3600',
        contentType: item.contentType,
        upsert: false
      })
      if (error) throw error
      uploadedPaths.push(storagePath)
      rows.push({
        court_id: courtId,
        storage_path: storagePath,
        original_name: item.originalName,
        sort_order: (latestImage?.sort_order || 0) + index + 1
      })
    }

    const { error } = await client.from('court_images').insert(rows)
    if (error) throw error
    return { uploaded: rows.length }
  } catch {
    if (uploadedPaths.length) await client.storage.from(courtImageBucket).remove(uploadedPaths)
    throw createError({ statusCode: 500, statusMessage: 'Fotografitë nuk mund të ruheshin.' })
  }
})
