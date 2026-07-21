import { createError, readBody } from 'h3'
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isAction(value: unknown): value is DashboardAction {
  return typeof value === 'string' && (actions as readonly string[]).includes(value)
}

function databaseError(message = 'Të dhënat nuk mund të ngarkoheshin.') {
  return createError({ statusCode: 500, statusMessage: message })
}

function isoDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim() || Number.isNaN(new Date(value).getTime())) {
    throw createError({ statusCode: 400, statusMessage: `${field} nuk është valide.` })
  }
  return value
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw createError({ statusCode: 400, statusMessage: `${field} nuk është valid.` })
  }
  return value as T
}

function reservationListOptions(payload: Record<string, unknown>) {
  const limit = payload.limit === undefined ? 300 : Number(payload.limit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw createError({ statusCode: 400, statusMessage: 'Kufiri i rezervimeve duhet të jetë nga 1 deri në 500.' })
  }

  const order = payload.order === 'asc' ? 'asc' : payload.order === undefined || payload.order === 'desc' ? 'desc' : null
  if (!order) throw createError({ statusCode: 400, statusMessage: 'Renditja nuk është valide.' })

  const hasStart = payload.startAt !== undefined
  const hasEnd = payload.endAt !== undefined
  if (hasStart !== hasEnd) {
    throw createError({ statusCode: 400, statusMessage: 'Data e fillimit dhe e përfundimit kërkohen bashkë.' })
  }

  const startAt = hasStart ? isoDate(payload.startAt, 'Data e fillimit') : undefined
  const endAt = hasEnd ? isoDate(payload.endAt, 'Data e përfundimit') : undefined
  if (startAt && endAt) {
    const duration = new Date(endAt).getTime() - new Date(startAt).getTime()
    if (duration <= 0 || duration > 366 * 24 * 60 * 60 * 1000) {
      throw createError({ statusCode: 400, statusMessage: 'Intervali i datave duhet të jetë deri në 366 ditë.' })
    }
  }

  let statuses: ReservationStatus[] | undefined
  if (payload.statuses !== undefined) {
    if (!Array.isArray(payload.statuses) || payload.statuses.some(status => typeof status !== 'string' || !(reservationStatuses as readonly string[]).includes(status))) {
      throw createError({ statusCode: 400, statusMessage: 'Statusi i rezervimit nuk është valid.' })
    }
    statuses = [...new Set(payload.statuses)] as ReservationStatus[]
  }

  const courtId = payload.courtId === undefined ? undefined : String(payload.courtId || '')
  if (courtId !== undefined && !isUuid(courtId)) {
    throw createError({ statusCode: 400, statusMessage: 'Fusha nuk është valide.' })
  }

  return { limit, order, startAt, endAt, courtId, statuses }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function requiredUuid(value: unknown, label: string) {
  if (typeof value !== 'string' || !isUuid(value)) {
    throw createError({ statusCode: 400, statusMessage: `${label} nuk eshte valid.` })
  }
  return value
}

function foreignKeyDeleteError(error: { code?: string } | null, label: string) {
  if (error?.code === '23503') {
    return createError({ statusCode: 409, statusMessage: `${label} nuk mund te fshihet sepse perdoret nga rezervime ose te dhena te tjera.` })
  }
  return createError({ statusCode: 400, statusMessage: `${label} nuk mund te fshihet.` })
}

function reportRangeOptions(payload: Record<string, unknown>) {
  const startAt = isoDate(payload.startAt, 'Data e fillimit')
  const endAt = isoDate(payload.endAt, 'Data e përfundimit')
  const duration = new Date(endAt).getTime() - new Date(startAt).getTime()

  if (duration <= 0 || duration > 366 * 24 * 60 * 60 * 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Intervali i datave duhet të jetë deri në 366 ditë.' })
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
    throw createError({ statusCode: 400, statusMessage: 'Veprimi i API-së nuk është valid.' })
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
      if (today.error || month.error || monthRows.error || previousRows.error || courts.error || upcoming.error) throw databaseError('Përmbledhja nuk mund të ngarkohej.')
      return { action: body.action, data: { today: today.count || 0, month: month.count || 0, revenue: (monthRows.data || []).reduce((sum, row) => sum + Number(row.price), 0), previousRevenue: (previousRows.data || []).reduce((sum, row) => sum + Number(row.price), 0), courts: courts.count || 0, monthRows: monthRows.data || [], upcoming: upcoming.data || [] } }
    }

    case 'reports.reservations': {
      const { startAt, endAt } = reportRangeOptions(payload)
      const { data, error } = await access.client.from('reservations').select('*, customers(first_name, last_name), courts(name)').gte('start_at', startAt).lt('start_at', endAt).order('start_at')
      if (error) throw databaseError('Raporti nuk mund të ngarkohej.')
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
        access.client.from('seasons').select('*').eq('is_active', true).order('starts_on'),
        access.client.from('price_rules').select('*').eq('is_active', true),
        access.client.from('extra_services').select('*').eq('is_active', true).order('name')
      ])
      if (customers.error || courts.error || seasons.error || prices.error || services.error) throw databaseError('Opsionet e rezervimit nuk mund të ngarkoheshin.')
      return {
        action: body.action,
        data: {
          customers: customers.data || [],
          courts: courts.data || [],
          seasons: seasons.data || [],
          priceRules: prices.data || [],
          extraServices: services.data || []
        }
      }
    }

    case 'reservations.availability': {
      const courtId = String(payload.courtId || '')
      const startAt = isoDate(payload.startAt, 'Data e fillimit')
      const endAt = isoDate(payload.endAt, 'Data e përfundimit')
      let query = access.client.from('reservations').select('id').eq('court_id', courtId).neq('status', 'cancelled').lt('start_at', endAt).gt('end_at', startAt).limit(1)
      if (typeof payload.excludeId === 'string') query = query.neq('id', payload.excludeId)
      const { data, error } = await query
      if (error) throw databaseError('Disponueshmëria nuk mund të kontrollohej.')
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
      if (error) throw createError({ statusCode: 400, statusMessage: error.message })
      return { action: body.action, data: true }
    }

    case 'reservations.cancel': {
      const id = requiredUuid(payload.id, 'Rezervimi')
      const { error } = await access.client.rpc('cancel_reservation', { p_reservation_id: id })
      if (error) throw createError({ statusCode: 400, statusMessage: error.message })
      return { action: body.action, data: true }
    }

    case 'reservations.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, statusMessage: 'Vetem admin dhe superadmin mund te fshijne rezervime.' })
      const id = requiredUuid(payload.id, 'Rezervimi')
      const { error, count } = await access.client.from('reservations').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Rezervimi')
      if (!count) throw createError({ statusCode: 404, statusMessage: 'Rezervimi nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'courts.list': {
      const { data, error } = await access.client.from('courts').select('*').order('name')
      if (error) throw databaseError('Fushat nuk mund të ngarkoheshin.')
      return { action: body.action, data: data || [] }
    }

    case 'seasons.list': {
      const { data, error } = await access.client.from('seasons').select('*').order('starts_on', { ascending: false })
      if (error) throw databaseError('Sezonet nuk mund të ngarkoheshin.')
      return { action: body.action, data: data || [] }
    }

    case 'seasons.save': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, statusMessage: 'Nuk keni autorizim për këtë veprim.' })
      const values = { name: String(payload.name || '').trim(), season_type: enumValue(payload.seasonType, ['summer', 'winter'] as const, 'Lloji i sezonit') as SeasonType, starts_on: isoDate(payload.startsOn, 'Data e fillimit').slice(0, 10), ends_on: isoDate(payload.endsOn, 'Data e përfundimit').slice(0, 10), is_active: payload.isActive !== false }
      if (values.ends_on < values.starts_on) throw createError({ statusCode: 400, statusMessage: 'Data e perfundimit duhet te jete pas dates se fillimit.' })
      const editingId = typeof payload.id === 'string' ? requiredUuid(payload.id, 'Sezoni') : null
      let overlapQuery = access.client
        .from('seasons')
        .select('id, name')
        .lte('starts_on', values.ends_on)
        .gte('ends_on', values.starts_on)
        .limit(1)
      if (editingId) overlapQuery = overlapQuery.neq('id', editingId)
      const { data: overlap, error: overlapError } = await overlapQuery.maybeSingle()
      if (overlapError) throw databaseError('Sezonet nuk mund te verifikoheshin.')
      if (overlap) throw createError({ statusCode: 409, statusMessage: `Rangu i datave mbivendoset me sezonin "${overlap.name}".` })
      const result = editingId
        ? await access.client.from('seasons').update(values).eq('id', editingId)
        : await access.client.from('seasons').insert(values)
      if (result.error) throw createError({ statusCode: 400, statusMessage: result.error.message })
      return { action: body.action, data: true }
    }

    case 'seasons.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, statusMessage: 'Nuk keni autorizim per kete veprim.' })
      const id = requiredUuid(payload.id, 'Sezoni')
      const { error, count } = await access.client.from('seasons').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Sezoni')
      if (!count) throw createError({ statusCode: 404, statusMessage: 'Sezoni nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'prices.list': {
      const { data, error } = await access.client
        .from('price_rules')
        .select('*, seasons(name, season_type)')
        .eq('duration_minutes', 60)
        .order('created_at', { ascending: false })
      if (error) throw databaseError('Çmimet nuk mund të ngarkoheshin.')
      return { action: body.action, data: data || [] }
    }

    case 'prices.save': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, statusMessage: 'Nuk keni autorizim për këtë veprim.' })
      const values = { season_id: String(payload.seasonId || ''), court_type: enumValue(payload.courtType, ['indoor', 'outdoor'] as const, 'Lloji i fushës') as CourtType, with_heating: false, duration_minutes: 60, price: Number(payload.price), is_active: payload.isActive !== false }
      const result = typeof payload.id === 'string'
        ? await access.client.from('price_rules').update(values).eq('id', payload.id)
        : await access.client.from('price_rules').insert(values)
      if (result.error) throw createError({ statusCode: 400, statusMessage: result.error.message })
      return { action: body.action, data: true }
    }

    case 'prices.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, statusMessage: 'Nuk keni autorizim per kete veprim.' })
      const id = requiredUuid(payload.id, 'Cmimi')
      const { error, count } = await access.client.from('price_rules').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Cmimi')
      if (!count) throw createError({ statusCode: 404, statusMessage: 'Cmimi nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'extra-services.list': {
      const { data, error } = await access.client.from('extra_services').select('*').order('name')
      if (error) throw databaseError('Shërbimet shtesë nuk mund të ngarkoheshin.')
      return { action: body.action, data: data || [] }
    }

    case 'extra-services.save': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, statusMessage: 'Nuk keni autorizim për këtë veprim.' })
      const values = { name: String(payload.name || '').trim(), description: typeof payload.description === 'string' ? payload.description.trim() || null : null, price: Number(payload.price), is_active: payload.isActive !== false }
      const result = typeof payload.id === 'string'
        ? await access.client.from('extra_services').update(values).eq('id', payload.id)
        : await access.client.from('extra_services').insert(values)
      if (result.error) throw createError({ statusCode: 400, statusMessage: result.error.message })
      return { action: body.action, data: true }
    }

    case 'extra-services.delete': {
      if (!['admin', 'superadmin'].includes(access.profile.role)) throw createError({ statusCode: 403, statusMessage: 'Nuk keni autorizim per kete veprim.' })
      const id = requiredUuid(payload.id, 'Sherbimi')
      const { error, count } = await access.client.from('extra_services').delete({ count: 'exact' }).eq('id', id)
      if (error) throw foreignKeyDeleteError(error, 'Sherbimi')
      if (!count) throw createError({ statusCode: 404, statusMessage: 'Sherbimi nuk u gjet.' })
      return { action: body.action, data: true }
    }

    case 'staff.list': {
      if (access.profile.role !== 'superadmin') {
        throw createError({ statusCode: 403, statusMessage: 'Vetëm superadmin mund ta shohë stafin.' })
      }
      const { data, error } = await access.client.from('profiles').select('*').order('created_at')
      if (error) throw databaseError('Stafi nuk mund të ngarkohej.')
      return { action: body.action, data: data || [] }
    }
  }
})
