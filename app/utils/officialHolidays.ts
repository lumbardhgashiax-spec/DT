import type { BookingHoliday } from '~/types/booking'

export function addIsoDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}

export function holidayForDate(holidays: BookingHoliday[], date: string) {
  return holidays.find(holiday => date >= holiday.startsOn && date <= holiday.endsOn) ?? null
}

export function holidayDates(holidays: BookingHoliday[]) {
  const dates = new Set<string>()

  for (const holiday of holidays) {
    let date = holiday.startsOn
    while (date <= holiday.endsOn) {
      dates.add(date)
      date = addIsoDays(date, 1)
    }
  }

  return [...dates]
}
