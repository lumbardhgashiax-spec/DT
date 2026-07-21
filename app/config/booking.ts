import type { BookingOpeningHours } from '~/types/booking'

/**
 * Public booking data comes from the server. These values are safe UI fallbacks
 * while that configuration is loading; they are not a source of court, season,
 * service, or price data.
 */
export const bookingConfig = {
  defaultTimezone: 'Europe/Belgrade',
  defaultOpeningHours: {
    start: '10:00',
    end: '22:00'
  } satisfies BookingOpeningHours,
  defaultSlotMinutes: 60,
  defaultDurationMinutes: 60,
  maxDurationMinutes: 5 * 60
} as const

export function getBusinessDateParts(date: string, timezone: string = bookingConfig.defaultTimezone) {
  const parsed = new Date(`${date}T12:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(parsed)

  const value = (type: string) => parts.find(part => part.type === type)?.value

  return {
    year: value('year') ?? '',
    month: value('month') ?? '',
    day: value('day') ?? ''
  }
}

export function getBusinessToday(timezone: string = bookingConfig.defaultTimezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? ''

  return `${value('year')}-${value('month')}-${value('day')}`
}

export function buildBusinessSlots(
  openingHours: BookingOpeningHours = bookingConfig.defaultOpeningHours,
  slotMinutes: number = bookingConfig.defaultSlotMinutes
) {
  const slots: string[] = []
  const [startHour = 0, startMinute = 0] = openingHours.start.split(':').map(Number)
  const [endHour = 0, endMinute = 0] = openingHours.end.split(':').map(Number)
  const start = (startHour * 60) + startMinute
  const end = (endHour * 60) + endMinute

  for (let minutes = start; minutes < end; minutes += slotMinutes) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return slots
}
