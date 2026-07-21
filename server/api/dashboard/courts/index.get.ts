import { createError } from 'h3'
import { requireDashboardAccess } from '../../../utils/dashboardAccess'
import { courtImageBucket } from '../../../utils/courtManagement'

export default defineEventHandler(async (event) => {
  const { client } = await requireDashboardAccess(event)
  const [courtsResult, imagesResult] = await Promise.all([
    client.from('courts').select('*').order('name'),
    client.from('court_images').select('*').order('sort_order').order('created_at')
  ])

  if (courtsResult.error || imagesResult.error) {
    throw createError({ statusCode: 500, statusMessage: 'Fushat nuk mund të ngarkoheshin.' })
  }

  const images = imagesResult.data || []
  const signedByPath = new Map<string, string>()
  if (images.length) {
    const { data, error } = await client.storage.from(courtImageBucket).createSignedUrls(
      images.map(image => image.storage_path),
      15 * 60
    )
    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Fotografitë e fushave nuk mund të ngarkoheshin.' })
    }
    data?.forEach((item) => {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl)
    })
  }

  return (courtsResult.data || []).map(court => ({
    ...court,
    images: images
      .filter(image => image.court_id === court.id)
      .map(({ storage_path: _storagePath, ...image }) => ({
        ...image,
        signedUrl: signedByPath.get(_storagePath) || ''
      }))
  }))
})
