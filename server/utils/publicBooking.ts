import type { SupabaseClient } from '@supabase/supabase-js'
import { createError, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database, TableRow } from '~/types/database.types'

declare const process: { env: Record<string, string | undefined> }

export const ACADEMY_TIME_ZONE = 'Europe/Belgrade'
export const PUBLIC_OPENING_HOUR = 10
export const PUBLIC_CLOSING_HOUR = 22
export const PUBLIC_SLOT_MINUTES = 60
export const PUBLIC_DURATION_MINUTES = 60
export const PUBLIC_MAX_DURATION_MINUTES = 5 * 60

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^(\d{2}):(\d{2})$/
const academyDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ACADEMY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
})

export type PublicServiceClient = SupabaseClient<Database>

export interface PublicBookingSelection {
  courtId: string
  date: string
  time?: string
  durationMinutes: number
  extraServiceIds: string[]
}

export interface PublicBookingCustomer {
  firstName: string
  lastName: string
  phone: string
  email: string | null
}

export interface PublicCreateBookingInput extends PublicBookingSelection {
  time: string
  customer: PublicBookingCustomer
}

interface ResolvedPublicQuote {
  courtId: string
  courtName: string
  courtType: TableRow<'courts'>['court_type']
  seasonId: string
  seasonName: string
  seasonType: TableRow<'seasons'>['season_type']
  priceRuleId: string
  date: string
  time?: string
  endTime?: string
  durationMinutes: number
  extras: Array<{
    id: string
    name: string
    description: string | null
    hourlyPrice: number
  }>
  courtHourlyPrice: number
  extrasHourlyPrice: number
  totalPrice: number
}

export interface PublicQuoteResponse {
  court: {
    id: string
    name: string
    courtType: TableRow<'courts'>['court_type']
  }
  season: {
    name: string
    type: TableRow<'seasons'>['season_type']
  }
  date: string
  time?: string
  endTime?: string
  durationMinutes: number
  extras: ResolvedPublicQuote['extras']
  courtHourlyPrice: number
  extrasHourlyPrice: number
  totalPrice: number
  currency: 'EUR'
}

export interface PublicBookingConfirmation {
  reference: string
  bookingReference: string
  courtName: string
  date: string
  time: string
  endTime: string
  durationMinutes: number
  totalPrice: number
  currency: 'EUR'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
}

type PublicReservationInsert = Database['public']['Tables']['reservations']['Insert']
type InsertedPublicReservation = Pick<TableRow<'reservations'>, 'id' | 'created_at'> & {
  booking_reference?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function logPublicBookingDatabaseError(step: string, error: unknown) {
  console.error(`[public-booking] ${step} failed:`, error)
}

export function isMissingBookingReferenceColumn(error: unknown) {
  if (!isRecord(error)) return false

  const code = typeof error.code === 'string' ? error.code : ''
  const message = [
    error.message,
    error.details,
    error.hint
  ]
    .filter((item): item is string => typeof item === 'string')
    .join(' ')
    .toLowerCase()

  return message.includes('booking_reference') && (
    code === 'PGRST204'
    || code === '42703'
    || message.includes('schema cache')
    || message.includes('column')
  )
}

function isBookingReferenceCollision(error: unknown) {
  if (!isRecord(error)) return false

  const code = typeof error.code === 'string' ? error.code : ''
  const message = [
    error.message,
    error.details,
    error.hint
  ]
    .filter((item): item is string => typeof item === 'string')
    .join(' ')
    .toLowerCase()

  return code === '23505' && message.includes('booking_reference')
}

function databaseError(message = 'Shërbimi i rezervimeve nuk është i disponueshëm tani.') {
  return createError({ statusCode: 500, statusMessage: message })
}

function invalidInput(message: string) {
  return createError({ statusCode: 422, statusMessage: message })
}

function academyDateParts(value: Date) {
  const parts = academyDateFormatter.formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value || 0)
  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
    second: part('second')
  }
}

function academyOffsetMs(value: Date) {
  const parts = academyDateParts(value)
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - value.getTime()
}

function normalizedDateParts(value: string) {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw invalidInput('Zgjidh një datë valide.')
  }

  const [yearText = '', monthText = '', dayText = ''] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw invalidInput('Zgjidh një datë valide.')
  }

  return { year, month, day }
}

function normalizedTimeParts(value: string, requireBookableTime = true) {
  if (typeof value !== 'string') throw invalidInput('Zgjidh një orë valide.')
  const match = timePattern.exec(value)
  if (!match) throw invalidInput('Zgjidh një orë valide.')

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59 || minute !== 0) {
    throw invalidInput('Zgjidh një orë valide.')
  }

  if (requireBookableTime && (hour < PUBLIC_OPENING_HOUR || hour >= PUBLIC_CLOSING_HOUR)) {
    throw invalidInput('Ora e rezervimit duhet të jetë nga 10:00 deri në 21:00.')
  }

  return { hour, minute }
}

function academyToday() {
  const { year, month, day } = academyDateParts(new Date())
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function academyCurrentTime() {
  const { hour, minute } = academyDateParts(new Date())
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function assertFutureBookingDate(date: string, time?: string) {
  const today = academyToday()
  if (date < today) {
    throw invalidInput('Nuk mund të rezervosh një termin në të kaluarën.')
  }
  if (time && date === today && time <= academyCurrentTime()) {
    throw invalidInput('Nuk mund të rezervosh një termin në të kaluarën.')
  }
}

function requireString(value: unknown, message: string, minLength: number, maxLength: number) {
  const normalized = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (normalized.length < minLength || normalized.length > maxLength) throw invalidInput(message)
  return normalized
}

function normalizePrice(value: unknown) {
  const price = Number(value)
  if (!Number.isFinite(price) || price < 0) throw databaseError('Një çmim aktiv nuk është i rregulluar si duhet.')
  return Math.round(price * 100) / 100
}

function publicBookingReference() {
  const now = academyDateParts(new Date())
  const datePart = [
    now.year.toString().slice(-2),
    now.month.toString().padStart(2, '0'),
    now.day.toString().padStart(2, '0')
  ].join('')
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()

  return `DT-${datePart}-${randomPart}`
}

export function setPublicResponseHeaders(event: H3Event) {
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseHeader(event, 'referrer-policy', 'same-origin')
  setResponseHeader(event, 'x-content-type-options', 'nosniff')
}

export function publicBookingEnvironmentStatus() {
  return {
    supabaseUrl: Boolean(process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    supabasePublicKey: Boolean(
      process.env.NUXT_PUBLIC_SUPABASE_KEY
      || process.env.SUPABASE_KEY
      || process.env.SUPABASE_PUBLISHABLE_KEY
      || process.env.SUPABASE_ANON_KEY
    ),
    supabaseServerKey: Boolean(
      process.env.NUXT_SUPABASE_SECRET_KEY
      || process.env.SUPABASE_SECRET_KEY
      || process.env.SUPABASE_SERVICE_ROLE_KEY
      || process.env.NUXT_SUPABASE_SERVICE_KEY
      || process.env.SUPABASE_SERVICE_KEY
    )
  }
}

export async function requirePublicBookingService(event: H3Event): Promise<PublicServiceClient> {
  const environment = publicBookingEnvironmentStatus()
  if (!environment.supabaseUrl || !environment.supabasePublicKey || !environment.supabaseServerKey) {
    console.error('[public-booking] Missing Supabase environment variable:', environment)
    throw createError({
      statusCode: 503,
      statusMessage: 'Shërbimi i rezervimeve nuk është i disponueshëm tani.'
    })
  }

  try {
    // Public booking requests stay on the server. The service role key is never
    // exposed to the browser, and it lets this controlled API write through RLS.
    return serverSupabaseServiceRole<Database>(event)
  } catch (error) {
    console.error('[public-booking] Supabase service role client is unavailable:', error instanceof Error ? error.message : error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Shërbimi i rezervimeve nuk është i disponueshëm tani.'
    })
  }
}

export function requirePublicUuid(value: unknown, message = 'Fusha e zgjedhur nuk është valide.') {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw invalidInput(message)
  return value
}

export function parsePublicDate(value: unknown) {
  if (typeof value !== 'string') throw invalidInput('Zgjidh një datë valide.')
  normalizedDateParts(value)
  assertFutureBookingDate(value)
  return value
}

export function parsePublicTime(value: unknown) {
  if (typeof value !== 'string') throw invalidInput('Zgjidh një orë valide.')
  normalizedTimeParts(value)
  return value
}

export function publicSlotTimes() {
  return Array.from(
    { length: PUBLIC_CLOSING_HOUR - PUBLIC_OPENING_HOUR },
    (_, index) => `${(PUBLIC_OPENING_HOUR + index).toString().padStart(2, '0')}:00`
  )
}

export function academyDateTimeToIso(date: string, time: string) {
  const { year, month, day } = normalizedDateParts(date)
  const { hour, minute } = normalizedTimeParts(time, false)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute))
  return new Date(utcGuess.getTime() - academyOffsetMs(utcGuess)).toISOString()
}

export function academyDateFromIso(value: string) {
  const { year, month, day } = academyDateParts(new Date(value))
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export function academyTimeFromIso(value: string) {
  const { hour, minute } = academyDateParts(new Date(value))
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export function addCalendarDays(date: string, days: number) {
  const { year, month, day } = normalizedDateParts(date)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return next.toISOString().slice(0, 10)
}

export function publicEndTime(time: string, durationMinutes = PUBLIC_DURATION_MINUTES) {
  const { hour, minute } = normalizedTimeParts(time)
  const total = hour * 60 + minute + durationMinutes
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export function publicDayRange(date: string) {
  return {
    startAt: academyDateTimeToIso(date, '00:00'),
    endAt: academyDateTimeToIso(addCalendarDays(date, 1), '00:00')
  }
}

export function parsePublicBookingSelection(value: unknown, timeRequired = false): PublicBookingSelection {
  if (!isRecord(value)) throw invalidInput('Kërkesa e rezervimit nuk është valide.')

  const courtId = requirePublicUuid(value.courtId)
  const date = parsePublicDate(value.date)
  const time = value.time === undefined || value.time === null || value.time === ''
    ? undefined
    : parsePublicTime(value.time)

  if (timeRequired && !time) throw invalidInput('Zgjidh një orë të rezervimit.')
  if (time) assertFutureBookingDate(date, time)

  const durationMinutes = value.durationMinutes === undefined
    ? PUBLIC_DURATION_MINUTES
    : Number(value.durationMinutes)

  if (
    !Number.isInteger(durationMinutes)
    || durationMinutes < PUBLIC_DURATION_MINUTES
    || durationMinutes > PUBLIC_MAX_DURATION_MINUTES
    || durationMinutes % PUBLIC_SLOT_MINUTES !== 0
  ) {
    throw invalidInput('Kohëzgjatja duhet të jetë nga 1 deri në 5 orë, me intervale njëorëshe.')
  }

  if (time) {
    const { hour, minute } = normalizedTimeParts(time)
    if ((hour * 60) + minute + durationMinutes > PUBLIC_CLOSING_HOUR * 60) {
      throw invalidInput('Intervali i zgjedhur kalon orarin e mbylljes.')
    }
  }

  if (value.extraServiceIds !== undefined && !Array.isArray(value.extraServiceIds)) {
    throw invalidInput('Shërbimet shtesë nuk janë valide.')
  }

  const inputIds = Array.isArray(value.extraServiceIds) ? value.extraServiceIds : []
  if (inputIds.length > 50) throw invalidInput('Mund të zgjidhen maksimumi 50 shërbime shtesë.')
  const extraServiceIds = inputIds.map(item => requirePublicUuid(item, 'Një shërbim shtesë nuk është valid.'))
  if (new Set(extraServiceIds).size !== extraServiceIds.length) {
    throw invalidInput('I njëjti shërbim shtesë nuk mund të zgjidhet dy herë.')
  }

  return { courtId, date, time, durationMinutes, extraServiceIds }
}

export function parsePublicCreateBookingInput(value: unknown): PublicCreateBookingInput {
  const selection = parsePublicBookingSelection(value, true)
  if (!isRecord(value) || !isRecord(value.customer)) {
    throw invalidInput('Të dhënat e klientit nuk janë valide.')
  }

  const firstName = requireString(value.customer.firstName, 'Emri duhet të ketë 2–100 karaktere.', 2, 100)
  const lastName = requireString(value.customer.lastName, 'Mbiemri duhet të ketë 2–100 karaktere.', 2, 100)
  const phone = typeof value.customer.phone === 'string' ? value.customer.phone.trim() : ''
  const phoneDigits = phone.match(/\d/g)?.length ?? 0
  if (!/^[+\d][\d\s-]{6,18}$/.test(phone) || phoneDigits < 7) {
    throw invalidInput('Shkruaj një numër telefoni valid.')
  }

  const rawEmail = typeof value.customer.email === 'string' ? value.customer.email.trim().toLowerCase() : ''
  if (rawEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) || rawEmail.length > 254)) {
    throw invalidInput('Email-i nuk është valid.')
  }

  return {
    ...selection,
    time: selection.time!,
    customer: { firstName, lastName, phone, email: rawEmail || null }
  }
}

export async function requireActivePublicCourt(client: PublicServiceClient, courtId: string) {
  const { data, error } = await client
    .from('courts')
    .select('id, name, court_type')
    .eq('id', courtId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw databaseError()
  if (!data) throw invalidInput('Fusha e zgjedhur nuk ekziston ose nuk është aktive.')
  return data
}

export async function resolvePublicBookingQuote(
  client: PublicServiceClient,
  input: PublicBookingSelection
): Promise<ResolvedPublicQuote> {
  const [courtResult, seasonResult] = await Promise.all([
    requireActivePublicCourt(client, input.courtId),
    client
      .from('seasons')
      .select('id, name, season_type')
      .eq('is_active', true)
      .lte('starts_on', input.date)
      .gte('ends_on', input.date)
      .maybeSingle()
  ])

  if (seasonResult.error) throw databaseError()
  if (!seasonResult.data) throw invalidInput('Nuk ka sezon aktiv për datën e zgjedhur.')

  const court = courtResult
  const season = seasonResult.data
  const priceResult = await client
    .from('price_rules')
    .select('id, price')
    .eq('season_id', season.id)
    .eq('court_type', court.court_type)
    .eq('with_heating', false)
    .eq('duration_minutes', PUBLIC_DURATION_MINUTES)
    .eq('is_active', true)
    .maybeSingle()

  if (priceResult.error) throw databaseError()
  if (!priceResult.data) throw invalidInput('Nuk ka çmim aktiv për këtë fushë dhe sezon.')

  let services: Array<Pick<TableRow<'extra_services'>, 'id' | 'name' | 'description' | 'price'>> = []
  if (input.extraServiceIds.length) {
    const { data, error } = await client
      .from('extra_services')
      .select('id, name, description, price')
      .in('id', input.extraServiceIds)
      .eq('is_active', true)

    if (error) throw databaseError()
    if (!data || data.length !== input.extraServiceIds.length) {
      throw invalidInput('Një nga shërbimet e zgjedhura nuk ekziston ose nuk është aktiv.')
    }
    services = data
  }

  const servicesById = new Map(services.map(service => [service.id, service]))
  const extras = input.extraServiceIds.map((id) => {
    const service = servicesById.get(id)
    if (!service) throw invalidInput('Një nga shërbimet e zgjedhura nuk ekziston ose nuk është aktiv.')
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      hourlyPrice: normalizePrice(service.price)
    }
  })

  const courtHourlyPrice = normalizePrice(priceResult.data.price)
  const extrasHourlyPrice = Math.round(extras.reduce((total, extra) => total + extra.hourlyPrice, 0) * 100) / 100
  const durationHours = input.durationMinutes / 60
  const totalPrice = Math.round((courtHourlyPrice + extrasHourlyPrice) * durationHours * 100) / 100

  return {
    courtId: court.id,
    courtName: court.name,
    courtType: court.court_type,
    seasonId: season.id,
    seasonName: season.name,
    seasonType: season.season_type,
    priceRuleId: priceResult.data.id,
    date: input.date,
    time: input.time,
    endTime: input.time ? publicEndTime(input.time, input.durationMinutes) : undefined,
    durationMinutes: input.durationMinutes,
    extras,
    courtHourlyPrice,
    extrasHourlyPrice,
    totalPrice
  }
}

export function publicQuoteResponse(quote: ResolvedPublicQuote): PublicQuoteResponse {
  return {
    court: { id: quote.courtId, name: quote.courtName, courtType: quote.courtType },
    season: { name: quote.seasonName, type: quote.seasonType },
    date: quote.date,
    ...(quote.time ? { time: quote.time } : {}),
    ...(quote.endTime ? { endTime: quote.endTime } : {}),
    durationMinutes: quote.durationMinutes,
    extras: quote.extras,
    courtHourlyPrice: quote.courtHourlyPrice,
    extrasHourlyPrice: quote.extrasHourlyPrice,
    totalPrice: quote.totalPrice,
    currency: 'EUR'
  }
}

export async function createPublicBooking(
  client: PublicServiceClient,
  input: PublicCreateBookingInput
): Promise<PublicBookingConfirmation> {
  const quote = await resolvePublicBookingQuote(client, input)
  const startAt = academyDateTimeToIso(input.date, input.time)
  const endAt = academyDateTimeToIso(input.date, publicEndTime(input.time, input.durationMinutes))

  const { data: customer, error: customerError } = await client
    .from('customers')
    .insert({
      first_name: input.customer.firstName,
      last_name: input.customer.lastName,
      phone: input.customer.phone,
      email: input.customer.email,
      created_by: null
    })
    .select('id')
    .single()

  if (customerError || !customer) {
    logPublicBookingDatabaseError('customer insert', customerError)
    throw databaseError('Të dhënat e klientit nuk mund të ruheshin.')
  }

  try {
    const reservationPayload: PublicReservationInsert = {
      customer_id: customer.id,
      court_id: quote.courtId,
      season_id: quote.seasonId,
      price_rule_id: quote.priceRuleId,
      start_at: startAt,
      end_at: endAt,
      with_heating: false,
      status: 'confirmed',
      price: quote.totalPrice,
      notes: null,
      created_by: null
    }

    let reservation: InsertedPublicReservation | null = null
    let reservationError: unknown = null

    for (let attempt = 0; attempt < 3 && !reservation; attempt += 1) {
      const result = await client
        .from('reservations')
        .insert({
          ...reservationPayload,
          booking_reference: publicBookingReference()
        })
        .select('id, booking_reference, created_at')
        .single()

      if (result.data) {
        reservation = result.data
        break
      }

      reservationError = result.error
      if (!isBookingReferenceCollision(result.error)) break
    }

    if (!reservation && isMissingBookingReferenceColumn(reservationError)) {
      const fallbackResult = await client
        .from('reservations')
        .insert(reservationPayload)
        .select('id, created_at')
        .single()

      if (fallbackResult.data) {
        reservation = {
          ...fallbackResult.data,
          booking_reference: fallbackResult.data.id
        }
      } else {
        reservationError = fallbackResult.error
      }
    }

    if (!reservation) {
      logPublicBookingDatabaseError('reservation insert', reservationError)
      if (isRecord(reservationError) && reservationError.code === '23P01') {
        throw createError({
          statusCode: 409,
          statusMessage: 'Ky termin sapo u rezervua. Zgjidh një orë tjetër.'
        })
      }
      throw databaseError('Rezervimi nuk mund të ruhej.')
    }

    return {
      reference: reservation.id,
      bookingReference: reservation.booking_reference || reservation.id,
      courtName: quote.courtName,
      date: input.date,
      time: input.time,
      endTime: publicEndTime(input.time, input.durationMinutes),
      durationMinutes: input.durationMinutes,
      totalPrice: quote.totalPrice,
      currency: 'EUR',
      status: 'confirmed',
      createdAt: reservation.created_at
    }
  } catch (error) {
    // The row belongs only to this request. A reservation that was actually
    // written holds a restrictive foreign key, so this cleanup cannot erase it.
    await client.from('customers').delete().eq('id', customer.id)
    throw error
  }
}
