import { createError } from 'h3'

export const courtAdminRoles = ['admin', 'superadmin'] as const
export const courtImageBucket = 'court-images'
export const allowedCourtImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const
export const maxCourtImageBytes = 8 * 1024 * 1024
export const maxCourtImagesPerRequest = 10

type CourtType = 'indoor' | 'outdoor'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function requireRecord(value: unknown) {
  if (!isRecord(value)) {
    throw createError({ statusCode: 400, statusMessage: 'Të dhënat e fushës nuk janë valide.' })
  }
  return value
}

export function requireUuid(value: unknown, message = 'ID-ja e fushës nuk është valide.') {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw createError({ statusCode: 400, statusMessage: message })
  }
  return value
}

function requiredName(value: unknown) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!name || name.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Emri i fushës kërkohet dhe mund të ketë deri në 100 karaktere.' })
  }
  return name
}

function courtType(value: unknown): CourtType {
  if (value === 'indoor' || value === 'outdoor') return value
  throw createError({ statusCode: 400, statusMessage: 'Lloji i fushës nuk është valid.' })
}

function coordinate(value: unknown, label: string, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw createError({ statusCode: 400, statusMessage: `${label} duhet të jetë nga ${min} deri në ${max}.` })
  }
  return parsed
}

/** Normalizes the only fields an admin may change on a court. */
export function courtValues(input: unknown) {
  const value = requireRecord(input)
  const latitude = coordinate(value.latitude, 'Gjerësia gjeografike', -90, 90)
  const longitude = coordinate(value.longitude, 'Gjatësia gjeografike', -180, 180)
  if ((latitude === null) !== (longitude === null)) {
    throw createError({ statusCode: 400, statusMessage: 'Latitude dhe longitude duhen vendosur bashkë.' })
  }

  return {
    name: requiredName(value.name),
    court_type: courtType(value.court_type),
    latitude,
    longitude,
    is_active: value.is_active !== false
  }
}

export function safeOriginalName(value: string | undefined) {
  const name = (value || 'fotografi').replace(/[\p{Cc}\\/]/gu, ' ').trim().replace(/\s+/g, ' ')
  return (name || 'fotografi').slice(0, 180)
}

function imageTypeFromBytes(data: Uint8Array): (typeof allowedCourtImageTypes)[number] | null {
  const isJpeg = data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  if (isJpeg) return 'image/jpeg'

  const isPng = data.length >= 8
    && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47
    && data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a
  if (isPng) return 'image/png'

  const isWebp = data.length >= 12
    && data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46
    && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50
  if (isWebp) return 'image/webp'

  return null
}

export function validateCourtImage(file: { data: Uint8Array, type?: string, filename?: string }) {
  if (!file.data.length) {
    throw createError({ statusCode: 400, statusMessage: 'Një fotografi është bosh.' })
  }
  if (file.data.length > maxCourtImageBytes) {
    throw createError({ statusCode: 400, statusMessage: 'Secila fotografi mund të jetë maksimumi 8 MB.' })
  }
  if (!allowedCourtImageTypes.includes(file.type as (typeof allowedCourtImageTypes)[number])) {
    throw createError({ statusCode: 400, statusMessage: 'Pranohen vetëm fotografi JPG, PNG ose WebP.' })
  }

  const detectedType = imageTypeFromBytes(file.data)
  if (!detectedType || detectedType !== file.type) {
    throw createError({ statusCode: 400, statusMessage: 'Përmbajtja e fotografisë nuk përputhet me formatin e deklaruar.' })
  }

  return {
    contentType: detectedType,
    extension: detectedType === 'image/jpeg' ? 'jpg' : detectedType === 'image/png' ? 'png' : 'webp',
    originalName: safeOriginalName(file.filename)
  }
}
