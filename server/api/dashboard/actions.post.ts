import { createError, readBody } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireDashboardAccess } from '../../utils/dashboardAccess'

const reservationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const

const actions = [
  'profile.get',
  'dashboard.overview',
  'reservations.list',
  'reports.reservations',
  'reservations.options',
  'reservations.availability',
  'reservations.save',
  'reservations.cancel',
  'reservations.delete',
  'courts.list',
  'seasons.list',
  'seasons.save',
  'seasons.delete',
  'prices.list',
  'prices.save',
  'prices.delete',
  'extra-services.list',
  'extra-services.save',
  'extra-services.delete',
  'staff.list'
] as const

type DashboardAction = typeof actions[number]
type ReservationStatus = typeof reservationStatuses[number]
type CourtType = 'indoor' | 'outdoor'
type SeasonType = 'summer' | 'winter'
type NormalizedSeason = Record<string, unknown> & {
  id: string
  name: string
  season_type: SeasonType
  starts_on: string
  ends_on: string
  is_active: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isAction(value: unknown): value is DashboardAction {
  return typeof value === 'string' && (actions as readonly string[]).includes(value)
}

function databaseError(message = 'Të dhënat nuk mund të ngarkoheshin.', error?: unknown) {
  if (isRecord(error)) {
    console.error('[dashboard-actions] database error:', {
      code: typeof error.code === 'string' ? error.code : undefined,
      message: typeof error.message === 'string' ? error.message : undefined,
      details: typeof error.details === 'string' ? error.details : undefined,
      hint: typeof error.hint === 'string' ? error.hint : undefined
    })
  }

  return createError({ statusCode: 500, message: message })
}

function isoDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim() || Number.isNaN(new Date(value).getTime())) {
    throw createError({ statusCode: 400, message: `${field} nuk Ã«shtÃ« valide.` })
  }
  return value
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw createError({ statusCode: 400, message: `${field} nuk Ã«shtÃ« valid.` })
  }
  return value as T
}

function reservationListOptions(payload: Record<string, unknown>) {
  const limit = payload.limit === undefined ? 300 : Number(payload.limit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw createError({ statusCode: 400, message: 'Kufiri i rezervimeve duhet tÃ« jetÃ« nga 1 deri nÃ« 500.' })
  }

  const order = payload.order === 'asc' ? 'asc' : payload.order === undefined || payload.order === 'desc' ? 'desc' : null
  if (!order) throw createError({ statusCode: 400, message: 'Renditja nuk Ã«shtÃ« valide.' })

  const hasStart = payload.startAt !== undefined
  const hasEnd = payload.endAt !== undefined
  if (hasStart !== hasEnd) {
    throw createError({ statusCode: 400, message: 'Data e fillimit dhe e pÃ«rfundimit kÃ«rkohen bashkÃ«.' })
  }

  const startAt = hasStart ? isoDate(payload.startAt, 'Data e fillimit') : undefined
  const endAt = hasEnd ? isoDate(payload.endAt, 'Data e pÃ«rfundimit') : undefined
  if (startAt && endAt) {
    const duration = new Date(endAt).getTime() - new Date(startAt).getTime()
    if (duration <= 0 || duration > 366 * 24 * 60 * 60 * 1000) {
      throw createError({ statusCode: 400, message: 'Intervali i datave duhet tÃ« jetÃ« deri nÃ« 366 ditÃ«.' })
    }
  }

  let statuses: ReservationStatus[] | undefined
  if (payload.statuses !== undefined) {
    if (!Array.isArray(payload.statuses) || payload.statuses.some(status => typeof status !== 'string' || !(reservationStatuses as readonly string[]).includes(status))) {
      throw createError({ statusCode: 400, message: 'Statusi i rezervimit nuk Ã«shtÃ« valid.' })
    }
    statuses = [...new Set(payload.statuses)] as ReservationStatus[]
  }

  const courtId = payload.courtId === undefined ? undefined : String(payload.courtId || '')
  if (courtId !== undefined && !isUuid(courtId)) {
    throw createError({ statusCode: 400, message: 'Fusha nuk Ã«shtÃ« valide.' })
  }

  return { limit, order, startAt, endAt, courtId, statuses }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function requiredUuid(value: unknown, label: string) {
  if (typeof value !== 'string' || !isUuid(value)) {
    throw createError({ statusCode: 400, message: `${label} nuk eshte valid.` })
  }
  return value
}

function foreignKeyDeleteError(error: { code?: string } | null, label: string) {
  if (error?.code === '23503') {
    return createError({ statusCode: 409, message: `${label} nuk mund te fshihet sepse perdoret nga rezervime ose te dhena te tjera.` })
  }
  return createError({ statusCode: 400, message: `${label} nuk mund te fshihet.` })
}

function dateMonthDayKey(date: string) {
  return Number(`${date.slice(5, 7)}${date.slice(8, 10)}`)
}

function inferSeasonType(startsOn: string, endsOn: string): SeasonType {
  const startMonth = Number(startsOn.slice(5, 7))
  const endMonth = Number(endsOn.slice(5, 7))
  return startMonth >= 4 && endMonth <= 10 ? 'summer' : 'winter'
}

function normalizeSeason(row: Record<string, unknown>): NormalizedSeason {
  const currentYear = new Date().getFullYear()
  const startsOn = typeof row.starts_on === 'string'
    ? row.starts_on
    : `${currentYear}-${String(row.starts_month || 1).padStart(2, '0')}-${String(row.starts_day || 1).padStart(2, '0')}`
  const endsOn = typeof row.ends_on === 'string'
    ? row.ends_on
    : `${currentYear}-${String(row.ends_month || 12).padStart(2, '0')}-${String(row.ends_day || 31).padStart(2, '0')}`
  const seasonType = typeof row.season_type === 'string'
    ? row.season_type
    : inferSeasonType(startsOn, endsOn)

  return {
    ...row,
    id: String(row.id || ''),
    name: String(row.name || ''),
    season_type: seasonType as SeasonType,
    starts_on: startsOn,
    ends_on: endsOn,
    is_active: row.is_active !== false
  }
}

function seasonRangeOverlaps(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  const firstStartKey = dateMonthDayKey(firstStart)
  const firstEndKey = dateMonthDayKey(firstEnd)
  const secondStartKey = dateMonthDayKey(secondStart)
  const secondEndKey = dateMonthDayKey(secondEnd)

  const expands = (start: number, end: number): Array<[number, number]> => start <= end
    ? [[start, end]]
    : [[start, 1231], [101, end]]

  return expands(firstStartKey, firstEndKey).some(first => expands(secondStartKey, secondEndKey).some(second => (
    first[0] <= second[1] && second[0] <= first[1]
  )))
}

function oldSeasonValues(values: { name: string, starts_on: string, ends_on: string, is_active: boolean }) {
  return {
    name: values.name,
    starts_month: Number(values.starts_on.slice(5, 7)),
    starts_day: Number(values.starts_on.slice(8, 10)),
    ends_month: Number(values.ends_on.slice(5, 7)),
    ends_day: Number(values.ends_on.slice(8, 10)),
    is_active: values.is_active
  }
}

async function listNormalizedSeasons(client: SupabaseClient) {
  const { data, error } = await client.from('seasons').select('*')
  if (error) throw databaseError('Sezonet nuk mund të ngarkoheshin.', error)

  return (data || [])
    .map(item => normalizeSeason(item as Record<string, unknown>))
    .sort((first, second) => String(second.starts_on).localeCompare(String(first.starts_on)))
}

function reportRangeOptions(payload: Record<string, unknown>) {
  const startAt = isoDate(payload.startAt, 'Data e fillimit')
  const endAt = isoDate(payload.endAt, 'Data e pÃ«rfundimit')
  const duration = new Date(endAt).getTime() - new Date(startAt).getTime()

  if (duration <= 0 || duration > 366 * 24 * 60 * 60 * 1000) {
    throw createError({ statusCode: 400, message: 'Intervali i datave duhet tÃ« jetÃ« deri nÃ« 366 ditÃ«.' })
  }

  return { startAt, endAt }
}

const academyTimeZone = 'Europe/Belgrade'
const academyDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: academyTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
})

function academyDateParts(value: Date) {
  const parts = academyDateFormatter.formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value || 0)
  return { year: part('year'), month: part('month'), day: part('day'), hour: part('hour'), minute: part('minute'), second: part('second') }
}

function academyOffsetMs(value: Date) {
  const parts = academyDateParts(value)
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - value.getTime()
}

function academyMidnight(year: number, month: number, day: number) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day))
  return new Date(utcGuess.getTime() - academyOffsetMs(utcGuess)).toISOString()
}

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)
  if (!isRecord(body) || !isAction(body.action)) {
    throw createError({ statusCode: 400, message: 'Veprimi i API-sÃ« nuk Ã«shtÃ« valid.' })
  }

  const payload = isRecord(body.payload) ? body.payload : {}
  const access = await requireDashboardAccess(event)

  switch (body.action) {
    case 'profile.get':
      return { action: body.action, data: access.profile }

    case 'dashboard.overview': {
      const now = new Date()
      const local = academyDateParts(now)
      const todayStart = academyMidnight(local.year, local.month, local.day)
      const todayEnd = academyMidnight(local.year, local.month, local.day + 1)
      const monthStart = academyMidnight(local.year, local.month, 1)
      const monthEnd = academyMidnight(local.year, local.month + 1, 1)
      const previousMonthStart = academyMidnight(local.year, local.month - 1, 1)
      const [today, month, monthRows, previousRows, courts, upcoming] = await Promise.all([
        access.client.from('reservations').select('*', { count: 'exact', head: true }).gte('start_at', todayStart).lt('start_at', todayEnd).neq('status', 'cancelled'),
        access.client.from('reservations').select('*', { count: 'exact', head: true }).gte('start_at', monthStart).lt('start_at', monthEnd).neq('status', 'cancelled'),
        access.client.from('reservations').select('start_at, price, status').gte('start_at', monthStart).lt('start_at', monthEnd).in('status', ['confirmed', 'completed']),
        access.client.from('reservations').select('price').gte('start_at', previousMonthStart).lt('start_at', monthStart).in('status', ['confirmed', 'completed']),
        access.client.from('courts').select('*', { count: 'exact', head: true }).eq('is_active', true),
        access.client.from('reservations').select('*, customers(first_name, last_name, phone, email), courts(name, court_type)').gte('start_at', now.toISOString()).neq('status', 'cancelled').order('start_at').limit(5)
      ])
      if (today.error || month.error || monthRows.error || previousRows.error || courts.error || upcoming.error) throw databaseError('PÃ«rmbledhja nuk mund tÃ« ngarkohej.')
      return { action: body.action, data: { today: today.count || 0, month: month.count || 0, revenue: (monthRows.data || []).reduce((sum, row) => sum + Number(row.price), 0), previousRevenue: (previousRows.data || []).reduce((sum, row) => sum + Number(row.price), 0), courts: courts.count || 0, monthRows: monthRows.data || [], upcoming: upcoming.data || [] } }
    }

    case 'reports.reservations': {
      const { startAt, endAt } = reportRangeOptions(payload)
      const { data, error } = await access.client.from('reservations').select('*, customers(first_name, last_name), courts(name)').gte('start_at', startAt).lt('start_at', endAt).order('start_at')
      if (error) throw databaseError('Raporti nuk mund tÃ« ngarkohej.')
      return { action: body.action, data: data || [] }
    }

    case 'reservations.list': {
      const options = reservationListOptions(payload)
      let query = access.client
        .from('reservations')
        .select('*, customers(first_name, last_name, phone, email), courts(name, court_type)')
        .order('start_at', { ascending: options.order === 'asc' })
        .limit(options.limit)

      if (options.startAt && options.endAt) query = query.gte('start_at', options.startAt).lt('start_at', options.endAt)
      if (options.courtId) query = query.eq('court_id', options.courtId)
      if (options.statuses?.length) query = query.in('status', options.statuses)

      const { data, error } = await query
      if (error) throw databaseError()
      return { action: body.action, data: data || [] }
    }

    case 'reservations.options': {
      const [customers, courts, seasons, prices, services] = await Promise.all([
        access.client.from('customers').select('*').order('created_at', { ascending: false }).limit(200),
        access.client.from('courts').select('*').order('name'),
        listNormalizedSeasons(access.serviceClient),
        access.client.from('price_rules').select('*').eq('is_active', true),
        access.client.from('extra_services').select('*').eq('is_active', true).order('name')
      ])
      if (customers.error || courts.error || prices.error || services.error) throw databaseError('Opsionet e rezervimit nuk mund tÃ« ngarkoheshin.')
      return {
        action: body.action,
        data: {
          customers: customers.data || [],
          courts: courts.data || [],
          seasons: seasons.filter(season => season.is_active !== false),
          priceRules: prices.data || [],
          extraServices: services.data || []
        }
      }
    }

    case 'reservations.availability': {
      const courtId = String(payload.courtId || '')
      const startAt = isoDate(payload.startAt, 'Data e fillimit')
      const endAt = isoDate(payload.endAt, 'Data e pÃ«rfundimit')
      let query = access.client.from('reservations').select('id').eq('court_id', courtId).neq('status', 'cancelled').lt('start_at', endAt).gt('end_at', startAt).limit(1)
      if (typeof payload.excludeId === 'string') query = query.neq('id', payload.excludeId)
      const { data, error } = await query
      if (error) throw databaseError('DisponueshmÃ«ria nuk mund tÃ« kontrollohej.')
      return { action: body.action, data: { available: !data?.length } }
    }

    case 'reservations.save': {
      const { error } = await access.client.rpc('upsert_reservation', {
        p_reservation_id: typeof payload.reservationId === 'string' ? payload.reservationId : null,
        p_customer_id: typeof payload.customerId === 'string' ? payload.customerId : null,
        p_first_name: String(payload.firstName || '').trim(),
        p_last_name: String(payload.lastName || '').trim(),
        p_phone: String(payload.phone || '').trim(),
        p_email: typeof payload.email === 'string' ? payload.email.trim() || null : null,
        p_court_id: String(payload.courtId || ''),
        p_start_at: isoDate(payload.startAt, 'Data e fillimit'),
        p_duration_minutes: Number(payload.durationMinutes),
        p_with_heating: false,
        p_status: enumValue(payload.status || 'confirmed', reservationStatuses, 'Statusi'),
        p_notes: typeof payload.notes === 'string' ? payload.notes.trim() || null : null,
        p_extra_service_ids: Array.isArray(payload.extraServiceIds) ? payload.extraServiceIds.filter((id): id is string => typeof id === 'string') : []
      })
      if (error) throw createError({ statusCode: 400, message: error.message })
      return { action: body.action, data: true }
    }

    case 'reservations.cancel': {
      const id = requiredUuid(payload.id, 'Rezervimi')
      const { error } = await access.client.rpc('cancel_reservation', { p_reservation_id: id })
      if (error) throw createError({ statusCode: 400, message: error.message })
      return { action: body.action, data: true }
    }

    case 'reservations.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, message: 'Vetem admin dhe superadmin mund te fshijne rezervime.' })
      const id = requiredUuid(payload.id, 'Rezervimi')
      const { error, count } = await access.client.from('reservations').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Rezervimi')
      if (!count) throw createError({ statusCode: 404, message: 'Rezervimi nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'courts.list': {
      const { data, error } = await access.client.from('courts').select('*').order('name')
      if (error) throw databaseError('Fushat nuk mund tÃ« ngarkoheshin.')
      return { action: body.action, data: data || [] }
    }

    case 'seasons.list': {
      const seasons = await listNormalizedSeasons(access.serviceClient)
      return { action: body.action, data: seasons }
    }

    case 'seasons.save': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, message: 'Nuk keni autorizim pÃ«r kÃ«tÃ« veprim.' })
      const values = { name: String(payload.name || '').trim(), season_type: enumValue(payload.seasonType, ['summer', 'winter'] as const, 'Lloji i sezonit') as SeasonType, starts_on: isoDate(payload.startsOn, 'Data e fillimit').slice(0, 10), ends_on: isoDate(payload.endsOn, 'Data e pÃ«rfundimit').slice(0, 10), is_active: payload.isActive !== false }
      const editingId = typeof payload.id === 'string' ? requiredUuid(payload.id, 'Sezoni') : null

      const existingSeasons = await listNormalizedSeasons(access.serviceClient)
      const overlap = existingSeasons.find(season => (
        season.id !== editingId
        && season.is_active !== false
        && values.is_active
        && seasonRangeOverlaps(String(season.starts_on), String(season.ends_on), values.starts_on, values.ends_on)
      ))
      if (overlap) throw createError({ statusCode: 409, message: `Rangu i datave mbivendoset me sezonin "${overlap.name}".` })

      const result = editingId
        ? await access.client.from('seasons').update(values).eq('id', editingId)
        : await access.client.from('seasons').insert(values)
      if (result.error && isRecord(result.error) && result.error.code === '42703') {
        const legacyValues = oldSeasonValues(values)
        const legacySeasons = access.client.from('seasons') as unknown as {
          update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> }
          insert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
        }
        const legacyResult = editingId
          ? await legacySeasons.update(legacyValues).eq('id', editingId)
          : await legacySeasons.insert(legacyValues)
        if (legacyResult.error) throw createError({ statusCode: 400, message: legacyResult.error.message })
      } else if (result.error) throw createError({ statusCode: 400, message: result.error.message })
      return { action: body.action, data: true }
    }

    case 'seasons.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, message: 'Nuk keni autorizim per kete veprim.' })
      const id = requiredUuid(payload.id, 'Sezoni')
      const { error, count } = await access.client.from('seasons').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Sezoni')
      if (!count) throw createError({ statusCode: 404, message: 'Sezoni nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'prices.list': {
      const [prices, seasons] = await Promise.all([
        access.client
          .from('price_rules')
          .select('*')
          .eq('duration_minutes', 60)
          .order('created_at', { ascending: false }),
        listNormalizedSeasons(access.serviceClient)
      ])
      if (prices.error) throw databaseError('Ã‡mimet nuk mund tÃ« ngarkoheshin.', prices.error)
      const seasonsById = new Map(seasons.map(season => [season.id, season]))
      const data = (prices.data || []).map(price => ({
        ...price,
        seasons: seasonsById.get(price.season_id) || null
      }))
      return { action: body.action, data }
    }

    case 'prices.save': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, message: 'Nuk keni autorizim pÃ«r kÃ«tÃ« veprim.' })
      const values = { season_id: String(payload.seasonId || ''), court_type: enumValue(payload.courtType, ['indoor', 'outdoor'] as const, 'Lloji i fushÃ«s') as CourtType, with_heating: false, duration_minutes: 60, price: Number(payload.price), is_active: payload.isActive !== false }
      const result = typeof payload.id === 'string'
        ? await access.client.from('price_rules').update(values).eq('id', payload.id)
        : await access.client.from('price_rules').insert(values)
      if (result.error) throw createError({ statusCode: 400, message: result.error.message })
      return { action: body.action, data: true }
    }

    case 'prices.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, message: 'Nuk keni autorizim per kete veprim.' })
      const id = requiredUuid(payload.id, 'Cmimi')
      const { error, count } = await access.client.from('price_rules').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Cmimi')
      if (!count) throw createError({ statusCode: 404, message: 'Cmimi nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'extra-services.list': {
      const { data, error } = await access.client.from('extra_services').select('*').order('name')
      if (error) throw databaseError('ShÃ«rbimet shtesÃ« nuk mund tÃ« ngarkoheshin.')
      return { action: body.action, data: data || [] }
    }

    case 'extra-services.save': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, message: 'Nuk keni autorizim pÃ«r kÃ«tÃ« veprim.' })
      const values = { name: String(payload.name || '').trim(), description: typeof payload.description === 'string' ? payload.description.trim() || null : null, price: Number(payload.price), is_active: payload.isActive !== false }
      const result = typeof payload.id === 'string'
        ? await access.client.from('extra_services').update(values).eq('id', payload.id)
        : await access.client.from('extra_services').insert(values)
      if (result.error) throw createError({ statusCode: 400, message: result.error.message })
      return { action: body.action, data: true }
    }

    case 'extra-services.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, message: 'Nuk keni autorizim per kete veprim.' })
      const id = requiredUuid(payload.id, 'Sherbimi')
      const { error, count } = await access.client.from('extra_services').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Sherbimi')
      if (!count) throw createError({ statusCode: 404, message: 'Sherbimi nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'staff.list': {
      if (access.profile.role !== 'superadmin') {
        throw createError({ statusCode: 403, message: 'VetÃ«m superadmin mund ta shohÃ« stafin.' })
      }
      const { data, error } = await access.client.from('profiles').select('*').order('created_at')
      if (error) throw databaseError('Stafi nuk mund tÃ« ngarkohej.')
      return { action: body.action, data: data || [] }
    }
  }
})
