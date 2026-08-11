import { createError } from 'h3'
import type { PublicServiceClient } from './publicBooking'

export interface PublicOfficialHoliday {
  id: string
  name: string
  startsOn: string
  endsOn: string
}

function publicHoliday(row: { id: string, name: string, starts_on: string, ends_on: string }): PublicOfficialHoliday {
  return {
    id: row.id,
    name: row.name,
    startsOn: row.starts_on,
    endsOn: row.ends_on
  }
}

function holidayDatabaseError() {
  return createError({
    statusCode: 500,
    message: 'Festat zyrtare nuk mund të kontrolloheshin tani.'
  })
}

export async function findPublicOfficialHoliday(client: PublicServiceClient, date: string) {
  const { data, error } = await client
    .from('official_holidays')
    .select('id, name, starts_on, ends_on')
    .eq('is_active', true)
    .lte('starts_on', date)
    .gte('ends_on', date)
    .order('starts_on')
    .limit(1)
    .maybeSingle()

  if (error) throw holidayDatabaseError()
  return data ? publicHoliday(data) : null
}

export async function listPublicOfficialHolidays(client: PublicServiceClient, fromDate: string) {
  const { data, error } = await client
    .from('official_holidays')
    .select('id, name, starts_on, ends_on')
    .eq('is_active', true)
    .gte('ends_on', fromDate)
    .order('starts_on')

  if (error) throw holidayDatabaseError()
  return (data || []).map(publicHoliday)
}

export async function requirePublicBookableDate(client: PublicServiceClient, date: string) {
  const holiday = await findPublicOfficialHoliday(client, date)
  if (holiday) {
    throw createError({
      statusCode: 409,
      message: `Më ${date} nuk pranohen rezervime online për shkak të festës “${holiday.name}”.`
    })
  }
}
