import { createError } from 'h3'
import { courtImageBucket } from './courtManagement'
import type { PublicServiceClient } from './publicBooking'
import type { TableRow } from '~/types/database.types'

const signedImageLifetimeSeconds = 5 * 60

export interface PublicCourtImage {
  id: string
  url: string
}

export interface PublicCourt {
  id: string
  name: string
  courtType: TableRow<'courts'>['court_type']
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
}

export interface PublicCourtDetail extends PublicCourt {
  images: PublicCourtImage[]
}

type PublicCourtSource = Pick<TableRow<'courts'>, 'id' | 'name' | 'court_type'>
  & Partial<Pick<TableRow<'courts'>, 'latitude' | 'longitude'>>

function toPublicCourt(
  court: PublicCourtSource,
  imageUrl: string | null = null
): PublicCourt {
  return {
    id: court.id,
    name: court.name,
    courtType: court.court_type,
    latitude: court.latitude ?? null,
    longitude: court.longitude ?? null,
    imageUrl
  }
}

function publicCourtError(message = 'Fushat nuk mund të ngarkoheshin tani.') {
  return createError({ statusCode: 500, statusMessage: message })
}

async function signedUrlsByPath(client: PublicServiceClient, paths: string[]) {
  if (!paths.length) return new Map<string, string>()

  const { data, error } = await client.storage
    .from(courtImageBucket)
    .createSignedUrls(paths, signedImageLifetimeSeconds)
  if (error) throw publicCourtError('Fotografitë e fushave nuk mund të ngarkoheshin tani.')

  const signedUrls = new Map<string, string>()
  data?.forEach((item) => {
    if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl)
  })
  return signedUrls
}

export async function listPublicCourts(
  client: PublicServiceClient,
  includeImages = true
): Promise<PublicCourt[]> {
  const { data: courts, error: courtsError } = await client
    .from('courts')
    .select('id, name, court_type')
    .eq('is_active', true)
    .order('name')

  if (courtsError) throw publicCourtError()
  if (!courts?.length || !includeImages) return (courts || []).map(court => toPublicCourt(court))

  const courtIds = courts.map(court => court.id)
  const { data: images, error: imagesError } = await client
    .from('court_images')
    .select('court_id, storage_path, sort_order, created_at')
    .in('court_id', courtIds)
    .order('sort_order')
    .order('created_at')

  // Court images are optional for public booking. A storage or image-table
  // configuration issue must not prevent visitors from choosing a court.
  if (imagesError) return courts.map(court => toPublicCourt(court))

  const firstImageByCourt = new Map<string, string>()
  for (const image of images || []) {
    if (!firstImageByCourt.has(image.court_id)) {
      firstImageByCourt.set(image.court_id, image.storage_path)
    }
  }

  let signedUrls = new Map<string, string>()
  try {
    signedUrls = await signedUrlsByPath(client, [...firstImageByCourt.values()])
  } catch {
    // The booking flow can safely continue without a visual court image.
  }

  return courts.map(court => toPublicCourt(
    court,
    firstImageByCourt.get(court.id)
      ? signedUrls.get(firstImageByCourt.get(court.id)!) || null
      : null
  ))
}

export async function getPublicCourt(client: PublicServiceClient, courtId: string): Promise<PublicCourtDetail | null> {
  const { data: court, error: courtError } = await client
    .from('courts')
    .select('id, name, court_type')
    .eq('id', courtId)
    .eq('is_active', true)
    .maybeSingle()

  if (courtError) throw publicCourtError()
  if (!court) return null

  const { data: images, error: imagesError } = await client
    .from('court_images')
    .select('id, storage_path')
    .eq('court_id', court.id)
    .order('sort_order')
    .order('created_at')

  if (imagesError) throw publicCourtError()

  const signedUrls = await signedUrlsByPath(client, (images || []).map(image => image.storage_path))
  const publicImages = (images || [])
    .map(image => ({ id: image.id, url: signedUrls.get(image.storage_path) || '' }))
    .filter(image => Boolean(image.url))

  return {
    ...toPublicCourt(court, publicImages[0]?.url || null),
    images: publicImages
  }
}

export async function listPublicExtraServices(client: PublicServiceClient) {
  const { data, error } = await client
    .from('extra_services')
    .select('id, name, description, price')
    .eq('is_active', true)
    .order('name')

  if (error) {
    if (error.code === '42501') {
      throw createError({ statusCode: 503, statusMessage: 'Shërbimet shtesë nuk kanë ende qasje publike.' })
    }

    if (error.code === '42P01' || error.code === 'PGRST205') {
      throw createError({ statusCode: 503, statusMessage: 'Tabela e shërbimeve shtesë nuk është e gatshme për rezervime publike.' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Shërbimet shtesë nuk mund të ngarkoheshin tani.' })
  }

  return (data || []).map(service => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price)
  }))
}
