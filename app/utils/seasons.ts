export interface RecurringSeasonRange {
  starts_month: number
  starts_day: number
  ends_month: number
  ends_day: number
}

const referenceYear = 2000
const millisecondsPerDay = 86_400_000
const referenceYearStart = Date.UTC(referenceYear, 0, 1)

export function daysInSeasonMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return 0
  return new Date(Date.UTC(referenceYear, month, 0)).getUTCDate()
}

export function seasonDayOrdinal(month: number, day: number) {
  if (!Number.isInteger(month) || !Number.isInteger(day) || day < 1 || day > daysInSeasonMonth(month)) return null
  return Math.floor((Date.UTC(referenceYear, month - 1, day) - referenceYearStart) / millisecondsPerDay) + 1
}

export function recurringSeasonContains(range: RecurringSeasonRange, month: number, day: number) {
  const value = seasonDayOrdinal(month, day)
  const start = seasonDayOrdinal(range.starts_month, range.starts_day)
  const end = seasonDayOrdinal(range.ends_month, range.ends_day)
  if (value === null || start === null || end === null) return false
  return start <= end ? value >= start && value <= end : value >= start || value <= end
}

export function recurringSeasonsOverlap(left: RecurringSeasonRange, right: RecurringSeasonRange) {
  for (let day = 1; day <= 366; day++) {
    const date = new Date(referenceYearStart + (day - 1) * millisecondsPerDay)
    const month = date.getUTCMonth() + 1
    const monthDay = date.getUTCDate()
    if (recurringSeasonContains(left, month, monthDay) && recurringSeasonContains(right, month, monthDay)) return true
  }
  return false
}

export function formatRecurringSeasonDate(month: number, day: number) {
  if (seasonDayOrdinal(month, day) === null) return 'Date jo valide'
  return new Intl.DateTimeFormat('sq-AL', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(referenceYear, month - 1, day)))
}
